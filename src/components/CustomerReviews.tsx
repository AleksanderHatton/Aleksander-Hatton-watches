import React, { useEffect, useRef, useState } from 'react';
import { buyerFeedback, ebayFeedbackProfile } from '../shared/ebay-feedback';

const watchPurchases = buyerFeedback.filter(review => review.category === 'watch');

export default function CustomerReviews() {
  const track = useRef<HTMLUListElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [edges, setEdges] = useState({ previous: false, next: false });
  const reviews = showAll ? buyerFeedback : watchPurchases;

  useEffect(() => {
    const list = track.current;
    if (!list) return;

    function updateEdges() {
      const previous = list.scrollLeft > 2;
      const next = list.scrollLeft + list.clientWidth < list.scrollWidth - 2;
      setEdges(current => current.previous === previous && current.next === next
        ? current
        : { previous, next });
    }

    list.scrollTo({ left: 0, behavior: 'instant' });
    updateEdges();
    list.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateEdges);
    observer?.observe(list);

    return () => {
      list.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
      observer?.disconnect();
    };
  }, [showAll]);

  function move(direction: -1 | 1) {
    const list = track.current;
    if (!list || list.children.length < 2) return;
    const first = list.children[0].getBoundingClientRect();
    const second = list.children[1].getBoundingClientRect();
    list.scrollBy({ left: direction * (second.left - first.left) });
  }

  return (
    <section id="customer-reviews" className="section buyer-feedback" aria-labelledby="feedback-heading">
      <div className="feedback-heading">
        <div>
          <h2 id="feedback-heading">What our eBay buyers say</h2>
          <p>Buyer usernames are shortened for privacy.</p>
        </div>
        <a className="feedback-source" href={ebayFeedbackProfile}>View our feedback on eBay</a>
      </div>
      <div className="feedback-filters" role="group" aria-label="Filter buyer reviews">
        <button type="button" aria-pressed={!showAll} aria-controls="feedback-cards" onClick={() => setShowAll(false)}>
          Watch purchases ({watchPurchases.length})
        </button>
        <button type="button" aria-pressed={showAll} aria-controls="feedback-cards" onClick={() => setShowAll(true)}>
          All purchases ({buyerFeedback.length})
        </button>
      </div>
      <ul className="feedback-track" id="feedback-cards" ref={track} tabIndex={0} aria-label={showAll ? 'All eBay buyer reviews' : 'Watch buyer reviews'}>
        {reviews.map(review => (
          <li className="feedback-card" key={review.item}>
            <div className="feedback-body">
              <div className="feedback-buyer">
                <span className="feedback-avatar" aria-hidden="true">{review.buyer.charAt(0).toUpperCase()}</span>
                <div><strong>{review.buyer}</strong><span className="feedback-byline">eBay buyer</span></div>
              </div>
              <blockquote>{review.comment}</blockquote>
              <div className="feedback-assessment">
                <span className="feedback-rating" data-rating={review.rating}>{review.rating} feedback</span>
                {review.fiveStarsInComment && (
                  <span className="feedback-quoted-stars"><span aria-hidden="true">★★★★★</span> Five stars in buyer’s comment</span>
                )}
              </div>
            </div>
            <div className="feedback-product">
              {review.photo && <img src={review.photo} width="58" height="58" loading="lazy" alt="" />}
              <div>
                {review.archive ? <a href={review.archive}>{review.product}</a> : <strong>{review.product}</strong>}
                <span>{review.details}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {(edges.previous || edges.next) && (
        <div className="feedback-controls" aria-label="Review navigation" role="group">
          <button type="button" onClick={() => move(-1)} disabled={!edges.previous} aria-controls="feedback-cards" aria-label="Previous review"><span aria-hidden="true">‹</span></button>
          <button type="button" onClick={() => move(1)} disabled={!edges.next} aria-controls="feedback-cards" aria-label="Next review"><span aria-hidden="true">›</span></button>
        </div>
      )}
    </section>
  );
}
