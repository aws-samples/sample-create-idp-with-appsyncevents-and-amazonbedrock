import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from "@aws-amplify/ui-react";
import CustomTheme from "./ui-customtheme/customTheme";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={CustomTheme}>
      <App />
    </ThemeProvider>
  </StrictMode>
)
