import React, { useEffect, useState } from 'react';
import { db } from '../firebase.ts';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Review {
  id: string;
  author: string;
  content: string;
  timestamp: any;
  title: string;
}

const ReviewList: React.FC<{ userId: string }> = ({ userId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const reviewsRef = collection(db, `users/${userId}/reviews`);
    const q = query(reviewsRef, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      setReviews(fetchedReviews);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <p className="text-gray-600">Loading reviews...</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-gray-600">No reviews available.</p>;
  }

  return (
    <ul>
      {reviews.map((review) => (
        <li
          key={review.id}
          className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-3"
        >
          <h3 className="text-xl font-semibold text-gray-900">{review.title}</h3>
          <p className="text-sm text-gray-500 italic">By: {review.author}</p>
          <p className="text-gray-800 mt-2">{review.content}</p>
          <small className="block mt-2 text-gray-500">
            {review.timestamp.toDate().toLocaleString()}
          </small>
        </li>
      ))}
    </ul>
  );
};

export default ReviewList;
