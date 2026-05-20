/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      "firebase/app": "./src/lib/firebase-mock/app.ts",
      "firebase/auth": "./src/lib/firebase-mock/auth.ts",
      "firebase/firestore": "./src/lib/firebase-mock/firestore.ts",
      "firebase/storage": "./src/lib/firebase-mock/storage.ts",
      "firebase/analytics": "./src/lib/firebase-mock/analytics.ts",
    },
  },
};

export default nextConfig;
