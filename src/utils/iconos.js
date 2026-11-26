import {
  Backpack, BookOpen, Cable, Calculator, Glasses, Headphones, IdCard, KeyRound, Laptop,
  Milk, Package, PencilRuler, Shirt, Smartphone, Umbrella, Wallet, Watch,
} from 'lucide-react';

const ICONOS = { Backpack, BookOpen, Cable, Calculator, Glasses, Headphones, IdCard, KeyRound, Laptop, Milk, PencilRuler, Shirt, Smartphone, Umbrella, Wallet, Watch };

export function iconoTipo(tipo) {
  return ICONOS[tipo?.icono] ?? Package;
}
