// This file helps Next.js understand which pages should be statically generated
// By returning an empty array, we're telling Next.js not to statically generate any pages
// This helps avoid the localStorage issue during build time

export async function generateStaticParams() {
  // Return an empty array to prevent static generation of any pages
  return [];
}
