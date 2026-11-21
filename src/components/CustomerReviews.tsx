import React, { useEffect, useRef, useState } from 'react';
import { buyerFeedback, ebayFeedbackProfile } from '../shared/ebay-feedback';

export default function CustomerReviews() {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });

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
  }, []);

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
          <p><a className="feedback-source" href={ebayFeedbackProfile}>Originally posted on eBay</a></p>
        </div>
        <div className="feedback-controls" aria-label="Review navigation" role="group">
          <button type="button" onClick={() => move(-1)} disabled={!edges.previous} aria-controls="feedback-cards" aria-label="Previous review">Previous</button>
          <button type="button" onClick={() => move(1)} disabled={!edges.next} aria-controls="feedback-cards" aria-label="Next review">Next</button>
        </div>
      </div>
      <ul className="feedback-track" id="feedback-cards" ref={track} tabIndex={0} aria-label="Watch buyer reviews">
        {buyerFeedback.map(review => (
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
