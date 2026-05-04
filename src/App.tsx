import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import InputPanen from "./pages/InputPanen";
import PetaniPage from "./pages/PetaniPage";
import BlokPage from "./pages/BlokPage";
import Laporan from "./pages/Laporan";
import PerawatanPage from "./pages/PerawatanPage";
import RekapPerawatan from "./pages/RekapPerawatan";
import Asisten from "./pages/Asisten";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound.tsx";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/input" element={<InputPanen />} />
            <Route path="/petani" element={<PetaniPage />} />
            <Route path="/blok" element={<BlokPage />} />
            <Route path="/laporan" element={<Laporan />} />
            <Route path="/perawatan" element={<PerawatanPage />} />
            <Route path="/rekap-perawatan" element={<RekapPerawatan />} />
            <Route path="/asisten" element={<Asisten />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
