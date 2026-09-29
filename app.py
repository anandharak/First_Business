import os
import io
import time
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_file
import qrcode
from pymongo import MongoClient
from pymongo.errors import PyMongoError

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['JSON_SORT_KEYS'] = False

# -------------------------------------------------------------
# DATABASE CONNECTION (MongoDB with Clean In-Memory Fallback)
# -------------------------------------------------------------
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://127.0.0.1:27017/shop_platform')
mongo_client = None
db = None
USE_MONGO = False

try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
    mongo_client.server_info()  # triggers exception if down
    db = mongo_client['shop_platform']
    USE_MONGO = True
    print(f"[*] Connected to MongoDB successfully at: {MONGODB_URI}")
except Exception as e:
    print(f"[!] MongoDB not available ({e}). Using live in-memory storage.")
    USE_MONGO = False

# In-memory storage fallback if MongoDB is offline (strictly LIVE data, no seeds)
memory_data = {
    'shops': {},
    'products': {},
    'orders': {}
}

def clean_doc(doc):
    if not doc:
        return None
    if '_id' in doc:
        doc['id'] = str(doc.pop('_id'))
    return doc

# -------------------------------------------------------------
# REST APIS - SHOPS
# -------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'database': 'MongoDB 8.2' if USE_MONGO else 'Live In-Memory',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/shops', methods=['GET'])
def get_shops():
    if USE_MONGO:
        shops = list(db.shops.find())
        return jsonify([clean_doc(s) for s in shops])
    return jsonify(list(memory_data['shops'].values()))

@app.route('/api/shops', methods=['POST'])
def create_shop():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Shop name is required'}), 400

    shop_id = str(uuid.uuid4())[:8]
    slug = name.lower().replace(' ', '-') + '-' + str(int(time.time()))[-4:]
    
    shop = {
        'id': shop_id,
        'name': name,
        'slug': slug,
        'category': data.get('category', 'food'),
        'tagline': data.get('tagline', 'Order directly from your table or phone'),
        'phone': (data.get('phone') or '').strip(),
        'upi_id': (data.get('upi_id') or '').strip(),
        'address': (data.get('address') or '').strip(),
        'table_count': int(data.get('table_count', 0)),
        'is_open': True,
        'currency': '₹',
        'banner_url': data.get('banner_url') or 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        'created_at': datetime.utcnow().isoformat()
    }

    if USE_MONGO:
        shop_doc = dict(shop)
        shop_doc['_id'] = shop_id
        db.shops.insert_one(shop_doc)
        shop_doc.pop('_id', None)
    else:
        memory_data['shops'][shop_id] = shop

    return jsonify(shop), 201

@app.route('/api/shops/<shop_id>', methods=['GET'])
def get_shop(shop_id):
    if USE_MONGO:
        s = db.shops.find_one({'_id': shop_id}) or db.shops.find_one({'id': shop_id})
        if s:
            return jsonify(clean_doc(s))
    elif shop_id in memory_data['shops']:
        return jsonify(memory_data['shops'][shop_id])
    return jsonify({'error': 'Shop not found'}), 404

@app.route('/api/shops/<shop_id>', methods=['PATCH'])
def update_shop(shop_id):
    data = request.json or {}
    allowed = ['is_open', 'name', 'tagline', 'phone', 'upi_id', 'address', 'banner_url']
    updates = {k: v for k, v in data.items() if k in allowed}

    if USE_MONGO:
        db.shops.update_one({'_id': shop_id}, {'$set': updates})
        s = db.shops.find_one({'_id': shop_id})
        return jsonify(clean_doc(s) if s else updates)
    else:
        if shop_id in memory_data['shops']:
            memory_data['shops'][shop_id].update(updates)
            return jsonify(memory_data['shops'][shop_id])
    return jsonify({'error': 'Shop not found'}), 404

@app.route('/api/shops/<shop_id>', methods=['DELETE'])
def delete_shop(shop_id):
    if USE_MONGO:
        db.shops.delete_one({'_id': shop_id})
        db.products.delete_many({'shop_id': shop_id})
        db.orders.delete_many({'shop_id': shop_id})
    else:
        memory_data['shops'].pop(shop_id, None)
        memory_data['products'] = {k: v for k, v in memory_data['products'].items() if v.get('shop_id') != shop_id}
        memory_data['orders'] = {k: v for k, v in memory_data['orders'].items() if v.get('shop_id') != shop_id}
    return jsonify({'success': True, 'message': 'Shop deleted'})

# -------------------------------------------------------------
# REST APIS - PRODUCTS / MENU ITEMS
# -------------------------------------------------------------
@app.route('/api/shops/<shop_id>/products', methods=['GET'])
def get_products(shop_id):
    if USE_MONGO:
        prods = list(db.products.find({'shop_id': shop_id}))
        return jsonify([clean_doc(p) for p in prods])
    prods = [p for p in memory_data['products'].values() if p.get('shop_id') == shop_id]
    return jsonify(prods)

@app.route('/api/shops/<shop_id>/products', methods=['POST'])
def add_product(shop_id):
    data = request.json or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Product name is required'}), 400

    prod_id = str(uuid.uuid4())[:8]
    price = float(data.get('price', 0))
    discount_price = float(data.get('discount_price', 0)) if data.get('discount_price') else None

    product = {
        'id': prod_id,
        'shop_id': shop_id,
        'name': name,
        'price': price,
        'discount_price': discount_price,
        'category': data.get('category', 'Main Course'),
        'dietary': data.get('dietary', 'veg'),  # veg, non-veg
        'description': data.get('description', ''),
        'prep_time': data.get('prep_time', '10-15 min'),
        'image_url': data.get('image_url') or 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        'is_available': True,
        'created_at': datetime.utcnow().isoformat()
    }

    if USE_MONGO:
        doc = dict(product)
        doc['_id'] = prod_id
        db.products.insert_one(doc)
    else:
        memory_data['products'][prod_id] = product

    return jsonify(product), 201

@app.route('/api/products/<prod_id>', methods=['DELETE'])
def delete_product(prod_id):
    if USE_MONGO:
        db.products.delete_one({'_id': prod_id})
    else:
        memory_data['products'].pop(prod_id, None)
    return jsonify({'success': True})

# -------------------------------------------------------------
# REST APIS - ORDERS
# -------------------------------------------------------------
@app.route('/api/shops/<shop_id>/orders', methods=['GET'])
def get_orders(shop_id):
    if USE_MONGO:
        ords = list(db.orders.find({'shop_id': shop_id}).sort('created_at', -1))
        return jsonify([clean_doc(o) for o in ords])
    ords = [o for o in memory_data['orders'].values() if o.get('shop_id') == shop_id]
    ords.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify(ords)

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json or {}
    shop_id = data.get('shop_id')
    items = data.get('items', [])
    if not shop_id or not items:
        return jsonify({'error': 'Shop ID and items are required'}), 400

    order_id = str(uuid.uuid4())[:8]
    order_num = f"#{int(time.time()) % 100000:05d}"
    
    total = sum((item.get('price', 0) * item.get('quantity', 1)) for item in items)
    tax = round(total * 0.05, 2)
    grand_total = round(total + tax, 2)

    order = {
        'id': order_id,
        'order_number': order_num,
        'shop_id': shop_id,
        'customer_name': data.get('customer_name') or 'Guest Customer',
        'customer_phone': data.get('customer_phone') or '',
        'order_type': data.get('order_type', 'dine_in'),
        'table_or_address': data.get('table_or_address', 'Table 1'),
        'items': items,
        'subtotal': total,
        'tax': tax,
        'total': grand_total,
        'payment_method': data.get('payment_method', 'online'),
        'status': 'received',  # received -> preparing -> ready -> completed
        'created_at': datetime.utcnow().isoformat()
    }

    if USE_MONGO:
        doc = dict(order)
        doc['_id'] = order_id
        db.orders.insert_one(doc)
    else:
        memory_data['orders'][order_id] = order

    return jsonify(order), 201

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_status(order_id):
    if USE_MONGO:
        ord_doc = db.orders.find_one({'_id': order_id}) or db.orders.find_one({'id': order_id})
        if ord_doc:
            return jsonify(clean_doc(ord_doc))
    elif order_id in memory_data['orders']:
        return jsonify(memory_data['orders'][order_id])
    return jsonify({'error': 'Order not found'}), 404

@app.route('/api/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    data = request.json or {}
    new_status = data.get('status')
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400

    if USE_MONGO:
        db.orders.update_one({'_id': order_id}, {'$set': {'status': new_status, 'updated_at': datetime.utcnow().isoformat()}})
        ord_doc = db.orders.find_one({'_id': order_id})
        return jsonify(clean_doc(ord_doc) if ord_doc else {'status': new_status})
    elif order_id in memory_data['orders']:
        memory_data['orders'][order_id]['status'] = new_status
        return jsonify(memory_data['orders'][order_id])
    return jsonify({'error': 'Order not found'}), 404

# -------------------------------------------------------------
# DYNAMIC PYTHON QR CODE GENERATION
# -------------------------------------------------------------
@app.route('/api/qr/<shop_id>', methods=['GET'])
def generate_qr(shop_id):
    table = request.args.get('table', '')
    base_url = request.host_url.rstrip('/')
    target_url = f"{base_url}/?shop={shop_id}"
    if table:
        target_url += f"&table={table}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(target_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

# -------------------------------------------------------------
# FRONTEND RENDER
# -------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"[*] Starting Python Shop Platform on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
