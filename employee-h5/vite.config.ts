import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({plugins:[vue()],server:{proxy:{'/api':{target:process.env.REPAIR_API_PROXY||'http://localhost:8800',changeOrigin:true,rewrite:path=>path.replace(/^\/api/,'')}}}})
