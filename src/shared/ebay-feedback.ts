export type EbayRating = 'Positive' | 'Neutral' | 'Negative';

interface EbayWatchFeedback {
  item: string;
  buyer: string;
  rating: EbayRating;
  comment: string;
  watch: string;
  details: string;
  archive?: string;
  photo?: string;
  fiveStarsInComment?: boolean;
}

export const ebayFeedbackProfile = 'https://www.ebay.co.uk/fdbk/feedback_profile/aleksander.h.watches';

// Buyer comments transcribed from the seller's November 2026 feedback screenshots.
// Store only shortened usernames. eBay feedback categories do not imply star scores.
export const watchFeedback: readonly EbayWatchFeedback[] = [
  {
    item: "198680472784",
    buyer: "a***x",
    rating: "Positive",
    comment: "Great seller. Communication is excellent. Watch delivered in good time and exactly as described. Thank you",
    watch: "TAG Heuer Formula 1 Chronograph",
    details: "CAH1110",
    archive: "/watch/f68d6fe4-6dd9-4d0d-9066-e59207df3c6f",
    photo: "https://ixbkkswkemwvrukqfdaf.supabase.co/storage/v1/object/public/watch-images/catalogue/b1bd16c1-76cc-4cd0-9509-3de8f2223d4f.jpg",
  },
  {
    item: "198592821510",
    buyer: "m***7",
    rating: "Positive",
    comment: "Great communication, posted within a reasonable time, well packaged, the watch I bought from this seller was like brand new, not a mark on it, very pleased, can highly recommend this seller.",
    watch: "Tissot Couturier Date",
    details: "T0354101103100",
    archive: "/watch/5ea8b61d-967e-49e0-8f96-5eb21165ee39",
    photo: "https://ixbkkswkemwvrukqfdaf.supabase.co/storage/v1/object/public/watch-images/catalogue/d61dd29e-9d05-42a5-b30c-41e49bab49f3.jpg",
  },
  {
    item: "198465844744",
    buyer: "t***3",
    rating: "Positive",
    comment: "As described, well protected, and quick delivery. A+++",
    watch: "Seiko Lord Matic",
    details: "5606-7050 · Spares or repairs",
  },
  {
    item: "198625157181",
    buyer: "s***0",
    rating: "Positive",
    comment: "Top !",
    watch: "Tissot PR 50 Titanium",
    details: "J376/476T",
    archive: "/watch/a4f1da88-e253-46ff-a66a-88d01fd40e49",
    photo: "https://ixbkkswkemwvrukqfdaf.supabase.co/storage/v1/object/public/watch-images/catalogue/db3c1a60-430c-406d-abfb-ee1ba43562aa.jpg",
  },
  {
    item: "198321929604",
    buyer: "d***9",
    rating: "Positive",
    comment: "Good watch. Thanks very much.",
    watch: "Tissot PRS 516 Chronograph",
    details: "T100.417.11.051.00",
  },
  {
    item: "198292260122",
    buyer: "m***2",
    rating: "Positive",
    comment: "Great ebayer, beautiful watch",
    watch: "TAG Heuer Aquaracer 300M Alarm",
    details: "WAF111Z",
  },
  {
    item: "198292502818",
    buyer: "w***s",
    rating: "Positive",
    comment: "Item as described thanks. A nice watch for a good price, fast despatch and delivery a highly recommended seller.",
    watch: "Vintage Timex Manual Wind",
    details: "Silver sunburst dial · Untested",
  },
  {
    item: "198161068843",
    buyer: "n***s",
    rating: "Negative",
    comment: "Cancelled the order as i won them cheap, now reselling the same item at a higher price, if you are not prepared to sell at the auction price put a reserve on or higher starting price...",
    watch: "Timex watch lot",
    details: "21 watches · Untested",
  },
  {
    item: "197061116193",
    buyer: "g***x",
    rating: "Positive",
    comment: "Postage secure and timely, package secure, watch excellent condition as described, only small issue watch has replacement strap which was put on upside down. But overall great product and value.",
    watch: "Orient Three Stars Automatic",
    details: "21 jewels",
  },
  {
    item: "196734389408",
    buyer: "h***7",
    rating: "Positive",
    comment: "Prompt despatch",
    watch: "Longines La Grande Classique",
    details: "L4.709.2",
  },
  {
    item: "196751807949",
    buyer: "m***6",
    rating: "Neutral",
    comment: "It was okay came bit late",
    watch: "Seiko 5 Automatic",
    details: "Gold-tone",
  },
  {
    item: "196219379628",
    buyer: "d***6",
    rating: "Positive",
    comment: "5 star all the way.",
    watch: "Lucien Piccard",
    details: "LP-28025-55",
    fiveStarsInComment: true,
  },
];
