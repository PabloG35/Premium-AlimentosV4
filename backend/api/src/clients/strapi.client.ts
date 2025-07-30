import axios from 'axios';
import { Injectable } from '@nestjs/common';

/**
 * Tipo que representa la forma en que Strapi
 * devuelve cada producto (incluyendo la imagen).
 */
export interface StrapiProduct {
  id: string;
  attributes: {
    sku: string;
    name: string;
    price: string; // decimal viene como texto
    description: string | null;
    stock: number;
    image?: {
      data: {
        attributes: {
          url: string;
        };
      };
    };
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Cliente simple para hacer peticiones a Strapi.
 */
const strapi = axios.create({
  baseURL: process.env.STRAPI_URL,
});

@Injectable()
export class StrapiClient {
  /** Trae un listado paginado de productos */
  async getProducts(skip = 0, limit = 100): Promise<StrapiProduct[]> {
    const res = await strapi.get<{ data: StrapiProduct[] }>('/products', {
      params: {
        'pagination[start]': skip,
        'pagination[limit]': limit,
        populate: 'image',
      },
    });
    return res.data.data;
  }

  /** Trae un solo producto por su ID */
  async getProductById(id: string): Promise<StrapiProduct | null> {
    try {
      const res = await strapi.get<{ data: StrapiProduct }>(`/products/${id}`, {
        params: { populate: 'image' },
      });
      return res.data.data;
    } catch {
      return null;
    }
  }

  /** (Opcional) Ejemplo de cómo traer reviews filtradas */
  async getReviewsByProduct(productId: string) {
    const res = await strapi.get<{ data: any[] }>('/reviews', {
      params: {
        filters: { product: { id: { $eq: productId } } },
        populate: 'product',
      },
    });
    return res.data.data;
  }
}
