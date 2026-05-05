import dts from "vite-plugin-dts";
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true
        })
    ],
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'Sfyri3D',
            fileName: 'index',
        },
        rollupOptions: {
            external: []
        },
        copyPublicDir: false,
        minify: true
    }
});