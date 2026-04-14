import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16" as any,
  typescript: true,
});

export async function GET(req: NextRequest) {
  try {
    // Fetch all active products
    const products = await stripe.products.list({ 
      active: true,
      limit: 100 
    });

    // Filter by metadata.product === "linkedinagent"
    const filteredProducts = products.data.filter(
      (product) => product.metadata?.product === "linkedinagent"
    );

    // Fetch prices for each product and map to our Plan interface
    const plans = await Promise.all(
      filteredProducts.map(async (product) => {
        const prices = await stripe.prices.list({ 
          product: product.id, 
          active: true, 
          limit: 1 
        });
        
        const price = prices.data[0];
        const amount = price?.unit_amount ? (price.unit_amount / 100).toFixed(0) : "0";
        const currency = price?.currency === "usd" ? "$" : (price?.currency?.toUpperCase() || "$");

        const defaultFeatures = [
          "AI content generation",
          "Automated LinkedIn posting",
          "Audience growth tracking",
          "Brand voice consistency",
        ];

        // Extract features from marketing_features (native Stripe field) or metadata
        let features: string[] = [];
        if (product.marketing_features && product.marketing_features.length > 0) {
          features = product.marketing_features.map((f: any) => f.name);
        } else if (product.metadata?.features) {
          features = product.metadata.features.split(",").map((f: string) => f.trim());
        } else {
          features = defaultFeatures;
        }

        return {
          id: price?.id || product.id,
          name: product.name,
          price: `${currency}${amount}`,
          description: product.description || "",
          features: features,
          popular: product.metadata?.popular === "true",
        };
      })
    );

    // Sort plans by price amount (low to high)
    const sortedPlans = plans.sort((a, b) => {
      const priceA = parseInt(a.price.replace(/[^0-9]/g, "")) || 0;
      const priceB = parseInt(b.price.replace(/[^0-9]/g, "")) || 0;
      return priceA - priceB;
    });

    return NextResponse.json({ products: sortedPlans });
  } catch (error: any) {
    console.error("Stripe API error:", error);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}
