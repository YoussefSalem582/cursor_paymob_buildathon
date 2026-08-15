/**
 * Root layout required by the App Router. html/body live in [locale]/layout
 * so this file only passes children through. Without it, a request that
 * misses the locale proxy (or a throwing proxy) 500s as Internal Server Error.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
