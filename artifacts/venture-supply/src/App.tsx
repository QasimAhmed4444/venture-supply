import * as React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { CartProvider } from "@/contexts/CartContext";

import { StorefrontLayout } from "@/layouts/StorefrontLayout";
import { AccountLayout } from "@/layouts/AccountLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { SalesLayout } from "@/layouts/SalesLayout";

import { HomePage } from "@/pages/HomePage";
import { ProductListingPage } from "@/pages/ProductListingPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrderSuccessPage } from "@/pages/OrderSuccessPage";
import { OrderTrackingPage } from "@/pages/OrderTrackingPage";
import { AuthPage } from "@/pages/AuthPage";
import { AboutPage, ContactPage, OffersPage, RequestProductPage } from "@/pages/StaticPages";
import { AdminLoginPage } from "@/pages/AdminLoginPage";

import {
  AccountDashboardPage,
  AccountOrdersPage,
  AccountAddressesPage,
  AccountProfilePage,
  AccountNotificationsPage,
  AccountSettingsPage,
} from "@/pages/AccountPages";

import {
  AdminDashboardPage,
  AdminCategoriesPage,
  AdminProductsPage,
  AdminInventoryPage,
  AdminOrdersPage,
  AdminCustomersPage,
  AdminSalespersonsPage,
  AdminPromotionsPage,
  AdminBrandsPage,
  AdminBusinessTypesPage,
  AdminReportsPage,
  AdminSettingsPage,
} from "@/pages/AdminPages";
import { AdminStaffPage } from "@/pages/AdminStaffPage";

import {
  SalesDashboardPage,
  SalesMyCustomersPage,
  SalesMyOrdersPage,
  SalesCreateOrderPage,
  SalesPerformancePage,
} from "@/pages/SalesPages";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function withStorefront(Component: React.ComponentType) {
  return () => (
    <StorefrontLayout>
      <Component />
    </StorefrontLayout>
  );
}

function withAccount(Component: React.ComponentType) {
  return () => (
    <AccountLayout>
      <Component />
    </AccountLayout>
  );
}

function withAdmin(Component: React.ComponentType) {
  return () => (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function withSales(Component: React.ComponentType) {
  return () => (
    <SalesLayout>
      <Component />
    </SalesLayout>
  );
}

function ProductListingAll() {
  return <ProductListingPage scope="all" />;
}
function ProductListingCategory() {
  return <ProductListingPage scope="category" />;
}
function ProductListingBrand() {
  return <ProductListingPage scope="brand" />;
}
function LoginPage() {
  return <AuthPage mode="login" />;
}
function RegisterPage() {
  return <AuthPage mode="register" />;
}

function AppRouter() {
  return (
    <Switch>
      {/* Storefront */}
      <Route path="/" component={withStorefront(HomePage)} />
      <Route path="/products" component={withStorefront(ProductListingAll)} />
      <Route path="/categories/:slug" component={withStorefront(ProductListingCategory)} />
      <Route path="/brands/:slug" component={withStorefront(ProductListingBrand)} />
      <Route path="/offers" component={withStorefront(OffersPage)} />
      <Route path="/products/:slug" component={withStorefront(ProductDetailPage)} />
      <Route path="/cart" component={withStorefront(CartPage)} />
      <Route path="/checkout" component={withStorefront(CheckoutPage)} />
      <Route path="/order-success" component={withStorefront(OrderSuccessPage)} />
      <Route path="/track/:tid" component={withStorefront(OrderTrackingPage)} />
      <Route path="/track" component={withStorefront(OrderTrackingPage)} />

      {/* Auth */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/admin/login" component={AdminLoginPage} />

      {/* Static */}
      <Route path="/about" component={withStorefront(AboutPage)} />
      <Route path="/contact" component={withStorefront(ContactPage)} />
      <Route path="/request-product" component={withStorefront(RequestProductPage)} />
      {/* Account (B2C / B2B) */}
      <Route path="/account" component={withAccount(AccountDashboardPage)} />
      <Route path="/account/orders" component={withAccount(AccountOrdersPage)} />
      <Route path="/account/addresses" component={withAccount(AccountAddressesPage)} />
      <Route path="/account/profile" component={withAccount(AccountProfilePage)} />
      <Route path="/account/notifications" component={withAccount(AccountNotificationsPage)} />
      <Route path="/account/settings" component={withAccount(AccountSettingsPage)} />

      {/* Admin */}
      <Route path="/admin" component={withAdmin(AdminDashboardPage)} />
      <Route path="/admin/categories" component={withAdmin(AdminCategoriesPage)} />
      <Route path="/admin/products" component={withAdmin(AdminProductsPage)} />
      <Route path="/admin/inventory" component={withAdmin(AdminInventoryPage)} />
      <Route path="/admin/orders" component={withAdmin(AdminOrdersPage)} />
      <Route path="/admin/customers" component={withAdmin(AdminCustomersPage)} />
      <Route path="/admin/salespersons" component={withAdmin(AdminSalespersonsPage)} />
      <Route path="/admin/promotions" component={withAdmin(AdminPromotionsPage)} />
      <Route path="/admin/brands" component={withAdmin(AdminBrandsPage)} />
      <Route path="/admin/business-types" component={withAdmin(AdminBusinessTypesPage)} />
      <Route path="/admin/reports" component={withAdmin(AdminReportsPage)} />
      <Route path="/admin/staff" component={withAdmin(AdminStaffPage)} />
      <Route path="/admin/settings" component={withAdmin(AdminSettingsPage)} />

      {/* Salesperson */}
      <Route path="/sales" component={withSales(SalesDashboardPage)} />
      <Route path="/sales/customers" component={withSales(SalesMyCustomersPage)} />
      <Route path="/sales/orders" component={withSales(SalesMyOrdersPage)} />
      <Route path="/sales/create-order" component={withSales(SalesCreateOrderPage)} />
      <Route path="/sales/performance" component={withSales(SalesPerformancePage)} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RoleProvider>
          <CartProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppRouter />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </CartProvider>
        </RoleProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
