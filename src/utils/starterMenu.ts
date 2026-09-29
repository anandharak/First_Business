import { Product } from '../types';
import { StoreService } from '../services/storeService';

export async function seedStarterProductsForShop(shopId: string, category: string): Promise<void> {
  const existing = await StoreService.getProducts(shopId);
  if (existing && existing.length > 0) return;

  const starterItems: Omit<Product, 'id' | 'rating' | 'reviewCount'>[] = [];

  if (category === 'fast_food' || category === 'food') {
    starterItems.push(
      {
        shopId,
        name: 'Whopper Supreme Grilled Burger',
        category: 'Burgers',
        price: 199,
        discountPrice: 179,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        description: 'Flame-grilled signature patty, crisp lettuce, juicy sliced tomatoes, onions, creamy mayo and crunchy pickles in a toasted sesame bun.',
        dietary: 'non-veg',
        prepTime: '8-10 min',
        isAvailable: true,
        tags: ['Bestseller', 'Chef Special', 'Flame Grilled'],
      },
      {
        shopId,
        name: 'Crispy Veg King Burger',
        category: 'Burgers',
        price: 129,
        discountPrice: 109,
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        description: 'Golden spiced potato & peas patty with melted cheese slice, tangy thousand island dressing & crunchy iceberg lettuce.',
        dietary: 'veg',
        prepTime: '6-8 min',
        isAvailable: true,
        tags: ['Popular', 'Veggie King'],
      },
      {
        shopId,
        name: 'King Size Peri Peri French Fries',
        category: 'Sides & Fries',
        price: 99,
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
        description: 'Extra crispy golden french fries tossed with zesty African peri-peri seasoning. Served hot.',
        dietary: 'veg',
        prepTime: '4-6 min',
        isAvailable: true,
        tags: ['Snack', 'Spicy'],
      },
      {
        shopId,
        name: 'Crispy Chicken Tenders (4 pcs)',
        category: 'Sides & Fries',
        price: 169,
        imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        description: 'Tender chicken breast fillets coated in a crunchy spiced golden batter, served with spicy garlic mayo dip.',
        dietary: 'non-veg',
        prepTime: '7-9 min',
        isAvailable: true,
        tags: ['Crispy', 'Snack'],
      },
      {
        shopId,
        name: 'Chilled Fountain Cola (500ml)',
        category: 'Beverages',
        price: 59,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        description: 'Ice-cold carbonated cola with fizzy bubbles. Perfect pairing with burgers and fries.',
        dietary: 'veg',
        prepTime: '1-2 min',
        isAvailable: true,
        tags: ['Chilled', 'Drink'],
      },
      {
        shopId,
        name: 'Warm Chocolate Lava Sundae',
        category: 'Desserts',
        price: 99,
        imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
        description: 'Warm chocolate cake with molten fudge center, topped with a scoop of creamy vanilla soft-serve and chocolate drizzle.',
        dietary: 'veg',
        prepTime: '3-5 min',
        isAvailable: true,
        tags: ['Sweet', 'Molten'],
      }
    );
  } else if (category === 'cafe') {
    starterItems.push(
      {
        shopId,
        name: 'Artisan Hazelnut Cappuccino',
        category: 'Coffee',
        price: 149,
        imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
        description: 'Double shot rich espresso with velvety steamed milk froth and aromatic toasted hazelnut syrup.',
        dietary: 'veg',
        prepTime: '4-5 min',
        isAvailable: true,
        tags: ['Hot', 'Aromatic'],
      },
      {
        shopId,
        name: 'Three-Cheese Grilled Panini',
        category: 'Sandwiches',
        price: 189,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
        description: 'Cheddar, mozzarella & gouda cheese melted on crusty sourdough bread with basil pesto.',
        dietary: 'veg',
        prepTime: '8-10 min',
        isAvailable: true,
        tags: ['Cheese', 'Crispy'],
      }
    );
  } else if (category === 'pizza') {
    starterItems.push(
      {
        shopId,
        name: 'Loaded Farmhouse Special Pizza (10")',
        category: 'Pizzas',
        price: 299,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        description: 'Crisp hand-tossed crust with herb tomato sauce, mozzarella, bell peppers, mushrooms, sweet corn and red onions.',
        dietary: 'veg',
        prepTime: '12-15 min',
        isAvailable: true,
        tags: ['Cheesy', 'Fresh'],
      }
    );
  }

  for (const item of starterItems) {
    try {
      await StoreService.addProduct(item);
    } catch (e) {
      console.warn('Could not auto-seed item:', item.name, e);
    }
  }
}
