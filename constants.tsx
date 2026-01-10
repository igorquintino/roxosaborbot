
import { Product, Category, StoreInfo } from './types';

/**
 * 🛠️ CONFIGURAÇÕES DA LOJA
 * Altere aqui os links das imagens e informações principais.
 */
export const STORE: StoreInfo = {
  name: "Roxo Sabor",
  tagline: "O Açaí mais cremoso da região", // Frase que aparece no banner
  hours: "Todos os dias, 09hrs às 21hrs",
  status: 'open', // 'open' para aberto, 'closed' para fechado
  rating: 4.9,
  reviewsCount: 23,
  distance: "2.7 km",
  minOrder: 20.00,
  
  // Imagem da Logotipo (Ícone no topo)
  logoUrl: "https://i.imgur.com/rlRstCp.png", 
  
  // Imagem do Banner Principal (Topo da página)
  bannerUrl: "https://i.imgur.com/noixE8b.jpeg"
};

export const CATEGORIES: Category[] = [
  { id: 'promos', name: 'Promoções' },
  { id: 'cup', name: 'Açaí no Copo' },
  { id: 'combos', name: 'Combos' },
  { id: 'extras', name: 'Adicionais' },
];

/**
 * 🍓 PRODUTOS DO CARDÁPIO
 * Altere a propriedade 'image' de cada produto para trocar a foto.
 */
export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Açaí 330 ml + 3 complementos',
    description: 'Nossa base artesanal. Escolha até 3 acompanhamentos grátis!',
    price: 24.99,
    image: 'https://i.imgur.com/LraZ9bq.jpeg',
    category: 'cup',
    isPopular: true
  },
  {
    id: '2',
    name: 'Açaí Gourmet Nutella',
    description: 'Nutella original, Leite Ninho em pó e morangos frescos selecionados.',
    price: 28.90,
    image: 'https://i.imgur.com/LraZ9bq.jpeg',
    category: 'cup'
  },
  {
    id: '3',
    name: 'Combo Casal Roxo',
    description: '2 Açaís de 500ml completos. A combinação perfeita para dividir.',
    price: 49.90,
    image: 'https://i.imgur.com/noixE8b.jpeg',
    category: 'combos'
  },
  {
    id: '4',
    name: 'Copo da Felicidade',
    description: 'Camadas de açaí, mousse de maracujá, raspas de chocolate e muito sabor.',
    price: 32.90,
    image: 'https://i.imgur.com/noixE8b.jpeg',
    category: 'promos',
    isPopular: true
  }
];
