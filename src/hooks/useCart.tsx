import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const productFound = cart.find(product => product.id === productId);
      const product = productFound ?? (await api.get(`products/${productId}`)).data;
      const amount = productFound ? productFound.amount + 1 : 1;
      const stockAmount = (await api.get(`stock/${product.id}`))?.data?.amount; 

      if (stockAmount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        throw new Error();
      }

      const newProduct = {...product, amount };
      const newCart = productFound 
      ? [
        ...cart.filter(product => product.id !== productFound.id),
        newProduct
      ]
      : [
        ...cart,
        newProduct
      ]
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productFound = cart.find(product => product.id === productId);
      if (productFound) {
        const newCart = cart.filter(product => product.id !== productFound.id);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw new Error();
      }
    } catch {
      // TODO
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        return;
      }
      
      const productFound = cart.find(product => product.id === productId);
      if (productFound) {
        const stock: Stock = (await api.get(`stock/${productId}`)).data;

        if (stock.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque')
          throw new Error();
        }

        const newProduct = { ...productFound, amount }
        const newCart = [
          ...cart.filter(product => product.id !== productId),
          newProduct
        ]

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));  
      } else {
        throw new Error();
      }

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
