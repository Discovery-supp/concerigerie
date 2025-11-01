import React from 'react';
import { Star, User, Calendar } from 'lucide-react';

interface Review {
  id: string;
  property_id: string;
  property?: {
    title: string;
  };
  guest?: {
    first_name: string;
    last_name: string;
  };
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsListProps {
  reviews: Review[];
  title?: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, title = 'Avis récents' }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun avis pour le moment</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.guest?.first_name} {review.guest?.last_name || 'Anonyme'}
                    </p>
                    {review.property && (
                      <p className="text-sm text-gray-500">{review.property.title}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              
              <div className="mb-3">
                {renderStars(review.rating)}
              </div>
              
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;

