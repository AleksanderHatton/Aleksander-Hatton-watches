export type EbayRating = 'Positive' | 'Neutral' | 'Negative';

interface EbayBuyerFeedback {
  item: string;
  buyer: string;
  rating: EbayRating;
  comment: string;
  product: string;
  details: string;
  archive?: string;
  photo?: string;
  fiveStarsInComment?: boolean;
}

export const ebayFeedbackProfile = 'https://www.ebay.co.uk/fdbk/feedback_profile/aleksander.h.watches';

// Selected buyer feedback for individual pre-owned watch sales, from the November 2026 eBay screenshots.
// The item ID distinguishes purchases, including repeat comments from one buyer.
export const buyerFeedback: readonly EbayBuyerFeedback[] = [
  {
    item: "198680472784",
    buyer: "a***x",
    rating: "Positive",
    comment: "Great seller. Communication is excellent. Watch delivered in good time and exactly as described. Thank you",
    product: "TAG Heuer Formula 1 Chronograph",
    details: "CAH1110",
    archive: "/watch/f68d6fe4-6dd9-4d0d-9066-e59207df3c6f",
    photo: "https://ixbkkswkemwvrukqfdaf.supabase.co/storage/v1/object/public/watch-images/catalogue/b1bd16c1-76cc-4cd0-9509-3de8f2223d4f.jpg",
  },
  {
    item: "198592821510",
    buyer: "m***7",
    rating: "Positive",
    comment: "Great communication, posted within a reasonable time, well packaged, the watch I bought from this seller was like brand new, not a mark on it, very pleased, can highly recommend this seller.",
    product: "Tissot Couturier Date",
    details: "T0354101103100",
    archive: "/watch/5ea8b61d-967e-49e0-8f96-5eb21165ee39",
    photo: "https://ixbkkswkemwvrukqfdaf.supabase.co/storage/v1/object/public/watch-images/catalogue/d61dd29e-9d05-42a5-b30c-41e49bab49f3.jpg",
  },
  {
    item: "198625157181",
    buyer: "s***0",
    rating: "Positive",
    comment: "Top !",
    product: "Tissot PR 50 Titanium",
    details: "J376/476T",
    archive: "/watch/a4f1da88-e253-46ff-a66a-88d01fd40e49",
    photo: "https://ixbkkswkemwvrukqfdaf.supabase.co/storage/v1/object/public/watch-images/catalogue/db3c1a60-430c-406d-abfb-ee1ba43562aa.jpg",
  },
  {
    item: "198621850911",
    buyer: "a***o",
    rating: "Positive",
    comment: "VERY FAST DELIVERY, ITEM WAS VERY WELL PACKAGED, I AM VERY PLEASED WITH THE QUALITY OF THE ITEM, AND AS DESCRIBED, GREAT VALUE. EXCELLENT SERVICE FROM THIS EXCELLENT SELLER. MANY THANKS.",
    product: "Tissot PR 50 Quartz",
    details: "J327/417",
  },
  {
    item: "198321929604",
    buyer: "d***9",
    rating: "Positive",
    comment: "Good watch. Thanks very much.",
    product: "Tissot PRS 516 Chronograph",
    details: "T100.417.11.051.00",
  },
  {
    item: "198301014308",
    buyer: "s***1",
    rating: "Positive",
    comment: "sehr gut",
    product: "Vintage Seiko 5 Automatic",
    details: "7S26-3100",
  },
  {
    item: "198326351325",
    buyer: "s***1",
    rating: "Positive",
    comment: "sehr gut",
    product: "Seiko 5 Automatic",
    details: "7019-8000 · Black and bronze dial",
  },
  {
    item: "198300790276",
    buyer: "s***1",
    rating: "Positive",
    comment: "sehr gut",
    product: "Seiko 5 Automatic",
    details: "7009-3040 · Black bullseye dial",
  },
  {
    item: "198183715050",
    buyer: "m***7",
    rating: "Positive",
    comment: "Arrived safely thank you",
    product: "Vintage Timex",
    details: "Cushion-shaped case · Deep blue dial",
  },
  {
    item: "198140784221",
    buyer: "b***r",
    rating: "Positive",
    comment: "As described. No problems with this transaction. Recommended⁸",
    product: "1969 Timex Marlin",
    details: "Manual wind · Expansion band",
  },
  {
    item: "198131581906",
    buyer: "m***1",
    rating: "Positive",
    comment: "Good",
    product: "Seiko 5 Automatic",
    details: "7S26-3110 · Two-tone steel",
  },
  {
    item: "198131549041",
    buyer: "m***n",
    rating: "Positive",
    comment: "All good",
    product: "Seiko Automatic",
    details: "17 jewels · Expansion band",
  },
  {
    item: "197544565152",
    buyer: "a***p",
    rating: "Positive",
    comment: "Excellent thank you",
    product: "Sekonda Classic",
    details: "3018A",
  },
  {
    item: "197504151289",
    buyer: "v***t",
    rating: "Positive",
    comment: "Quick delivery, good price. Thank you!",
    product: "Vintage Seiko 5 Automatic",
    details: "7009-7031 · 21 jewels",
  },
  {
    item: "197038794764",
    buyer: "s***0",
    rating: "Positive",
    comment: "very nice item exactly as described",
    product: "Vintage Citizen Automatic Eagle 7",
    details: "4-231080 KT · 21 jewels",
  },
  {
    item: "196734422286",
    buyer: "g***0",
    rating: "Positive",
    comment: "As described",
    product: "Lorus Chronograph",
    details: "RM377BX-9",
  },
  {
    item: "197061116193",
    buyer: "g***x",
    rating: "Positive",
    comment: "Postage secure and timely, package secure, watch excellent condition as described, only small issue watch has replacement strap which was put on upside down. But overall great product and value.",
    product: "Orient Three Stars Automatic",
    details: "21 jewels",
  },
  {
    item: "196734389408",
    buyer: "h***7",
    rating: "Positive",
    comment: "Prompt despatch",
    product: "Longines La Grande Classique",
    details: "L4.709.2",
  },
  {
    item: "196734373394",
    buyer: "r***a",
    rating: "Positive",
    comment: "Excellent seller, highly recommend",
    product: "1978 Tissot Seastar",
    details: "Cal. 2030",
  },
  {
    item: "196751807949",
    buyer: "m***6",
    rating: "Neutral",
    comment: "It was okay came bit late",
    product: "Seiko 5 Automatic",
    details: "Gold-tone",
  },
  {
    item: "196734392866",
    buyer: "j***7",
    rating: "Positive",
    comment: "As described",
    product: "Seiko SQ50",
    details: "Gold-plated watch",
  },
  {
    item: "196219379628",
    buyer: "d***6",
    rating: "Positive",
    comment: "5 star all the way.",
    product: "Lucien Piccard",
    details: "LP-28025-55",
    fiveStarsInComment: true,
  },
  {
    item: "196206601430",
    buyer: "w***1",
    rating: "Positive",
    comment: "1st CLASS SERVICE-RECOMMENDED-AAA+++",
    product: "1976 Timex military watch",
    details: "Vintage Timex",
  },
  {
    item: "196089849601",
    buyer: "p***s",
    rating: "Positive",
    comment: "Great, thank you! Great seller :)",
    product: "Vintage Seiko 5",
    details: "Automatic",
  },
];
