import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        {/* Icon fonts are loaded by useFonts(Ionicons.font, Feather.font) in app/_layout.tsx.
            With expo-font plugin and web.output: "static", Expo embeds @font-face at build time. */}
      </head>
      <body>{children}</body>
    </html>
  );
}
