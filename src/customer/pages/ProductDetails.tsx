import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsService } from '../../services/products.service';
import { Product } from '../../types/product';
import { ProductDetailsView } from '../components/ProductDetailsView';
import { Loading } from '../../components/ui/Loading';
import { ErrorState } from '../../components/ui/ErrorState';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProd = async () => {
      setLoading(true);
      try {
        const found = await productsService.getProductById(id);
        setProduct(found);
      } finally {
        setLoading(false);
      }
    };
    fetchProd();
  }, [id]);

  if (loading) {
    return <Loading message="Loading diya details..." />;
  }

  if (!product) {
    return (
      <ErrorState
        title="Product Not Found"
        message="The requested diya item is no longer available or URL is invalid."
        onRetry={() => navigate('/')}
        retryText="Return to Home"
      />
    );
  }

  return (
    <ProductDetailsView
      product={product}
      onClose={() => navigate(-1)}
    />
  );
};
