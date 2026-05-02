import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import productsRouter from "./products.js";
import categoriesRouter from "./categories.js";
import brandsRouter from "./brands.js";
import adminRouter from "./admin.js";
import ordersRouter from "./orders.js";
import customersRouter from "./customers.js";
import dashboardRouter from "./dashboard.js";
import authRouter from "./auth.js";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(adminRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(dashboardRouter);

export default router;
