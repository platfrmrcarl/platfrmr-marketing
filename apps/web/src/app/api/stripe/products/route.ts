import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function GET() {
  try {
    const productId = process.env.STRIPE_PRODUCT_ID;

    if (!productId) {
      return NextResponse.json({ error: "STRIPE_PRODUCT_ID is not configured" }, { status: 404 });
    }

    const productResponse = await stripe.products.retrieve(productId, {
      expand: ["default_price"],
    });

    if ("deleted" in productResponse && productResponse.deleted) {
      return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 });
    }

    const product = productResponse as Stripe.Product;

    if (!product.active) {
      return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 });
    }

    let price =
      typeof product.default_price === "string"
        ? null
        : (product.default_price ?? null);

    if (!price) {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1,
      });
      price = prices.data[0] ?? null;
    }

    if (!price || typeof price.unit_amount !== "number") {
      return NextResponse.json({ error: "No valid price found for product" }, { status: 404 });
    }

    const productMarketingFeatures =
      Array.isArray((product as any).marketing_features)
        ? (product as any).marketing_features
            .map((feature: any) => feature?.name)
            .filter((name: unknown): name is string => typeof name === "string" && name.trim().length > 0)
        : [];

    const metadataMarketingFeatures =
      product.metadata?.marketing_features
        ?.split(",")
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0) ?? [];

    const marketingFeatures =
      productMarketingFeatures.length > 0 ? productMarketingFeatures : metadataMarketingFeatures;

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      unitAmount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval ?? "month",
      marketingFeatures,
    });
  } catch (error: any) {
    console.error("Stripe product fetch error:", error);
    const isNotFound =
      error?.statusCode === 404 ||
      (typeof error?.message === "string" && error.message.toLowerCase().includes("no such"));
    return NextResponse.json(
      { error: error.message || "Failed to load product" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}