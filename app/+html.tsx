import { ScrollViewStyleReset } from 'expo-router/html';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />

        {/* THIS forces the web to load the vector icons so they don't 404 on Netlify */}
        <style type="text/css" dangerouslySetInnerHTML={{ __html: Feather.font }} />
        <style type="text/css" dangerouslySetInnerHTML={{ __html: Ionicons.font }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
