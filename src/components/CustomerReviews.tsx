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
          <h2 id="feedback-heading">Customer reviews</h2>
          <p>From customers who bought from us on <a className="feedback-source" href={ebayFeedbackProfile} aria-label="View our buyer feedback on eBay">eBay</a>.</p>
        </div>
        <div className="feedback-tools">
          <label className="feedback-filter">
            <span className="sr-only">Filter reviews by purchase</span>
            <select value={showAll ? 'all' : 'watch'} onChange={event => setShowAll(event.target.value === 'all')} aria-controls="feedback-cards">
              <option value="watch">Watch purchases ({watchPurchases.length})</option>
              <option value="all">All purchases ({buyerFeedback.length})</option>
            </select>
          </label>
          <div className="feedback-controls" aria-label="Review navigation" role="group">
            <button type="button" onClick={() => move(-1)} disabled={!edges.previous} aria-controls="feedback-cards" aria-label="Previous review">Previous</button>
            <button type="button" onClick={() => move(1)} disabled={!edges.next} aria-controls="feedback-cards" aria-label="Next review">Next</button>
          </div>
        </div>
      </div>
      <ul className="feedback-track" id="feedback-cards" ref={track} tabIndex={0} aria-label={showAll ? 'All buyer reviews' : 'Watch buyer reviews'}>
        {reviews.map(review => (
          <li className="feedback-card" key={review.item}>
            <div className="feedback-body">
              <div className="feedback-meta">
                <span className="feedback-rating" data-rating={review.rating}>{review.rating} feedback</span>
                <span className="feedback-buyer"><span className="sr-only">Buyer </span>{review.buyer}</span>
              </div>
              <blockquote>{review.comment}</blockquote>
              {review.fiveStarsInComment && <span className="feedback-quoted-stars" aria-hidden="true">★★★★★</span>}
            </div>
            <div className="feedback-product">
              {review.photo && <img src={review.photo} width="48" height="48" loading="lazy" alt="" />}
              <div>
                {review.archive ? <a href={review.archive}>{review.product}</a> : <strong>{review.product}</strong>}
                <span>{review.details}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
