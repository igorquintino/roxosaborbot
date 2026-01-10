
import { Product, Category, StoreInfo } from './types';

export const STORE: StoreInfo = {
  name: "Roxo Sabor",
  hours: "Todos os dias, 09hrs às 21hrs",
  status: 'closed', // Mocking closed as per screenshot
  rating: 4.9,
  reviewsCount: 23,
  distance: "2.7 km",
  minOrder: 20.00
};

export const CATEGORIES: Category[] = [
  { id: 'promos', name: 'Promoções' },
  { id: 'cup', name: 'Açaí no Copo' },
  { id: 'combos', name: 'Combos' },
  { id: 'extras', name: 'Adicionais' },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Açaí 330 ml + 3 complementos grátis',
    description: 'Escolha até 3 acompanhamentos grátis para turbinar seu açaí!',
    price: 24.99,
    image: './prod-acai.png',
    category: 'cup',
    isPopular: true
  },
  {
    id: '2',
    name: 'Açaí Gourmet',
    description: 'Com Nutella, Ninho e morangos frescos picados na hora.',
    price: 24.90,
    image: './prod-acai.png',
    category: 'cup'
  },
  {
    id: '3',
    name: 'Combo Família',
    description: '2 Açaís de 500ml + 5 complementos cada.',
    price: 45.00,
    image: './prod-acai.png',
    category: 'combos'
  },
  {
    id: '4',
    name: 'Copo da Felicidade',
    description: 'Açaí trufado com chocolate belga e confeitos.',
    price: 29.90,
    image: 'https://picsum.photos/seed/acai3/400/300',
    category: 'promos',
    isPopular: true
  }
];
