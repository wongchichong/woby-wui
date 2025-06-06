import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

const config = defineConfig({
    build: {
        minify: false,
        lib: {
            entry: ["index.html"],
            name: "woby-wui",
            formats: [/*'cjs', '*/'es'/*, 'umd'*/],
            fileName: (format: string, entryName: string) => `${entryName}.${format}.js`
        },
        outDir: './build',
        sourcemap: false,
    },
    esbuild: {
        jsx: 'automatic',
    },
    plugins: [
        tailwindcss(),
    ],
    resolve: {
        alias: {
            'woby/jsx-dev-runtime': path.resolve('../woby/src/jsx'),
            'woby/jsx-runtime': path.resolve('../woby/src/jsx'),
            'woby-wui': path.resolve('../woby-wui/src'),
            'woby': path.resolve('../woby/src'),
        }
    }
})



export default config
