"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Pagination, { usePagination } from "@/components/Pagination";
import {
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  FileText,
  ChevronDown,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  Package,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Wallet,
  PackageCheck,
  TrendingUp,
  DollarSign,
  Truck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const ORDER_STAGES = ["Pending", "Processing", "Shipping", "Delivered"];

export default function OrdersClient({
  initialOrders,
}: {
  initialOrders: any[];
}) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [orders, setOrders] = useState<any[]>(
    initialOrders.map((order: any) => ({
      ...order,
      status: order.status || (order.isDelivered ? "Delivered" : "Pending"),
    })),
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState("AllTime");
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [trackingData, setTrackingData] = useState({
    courierName: "",
    awbNumber: "",
    trackingLink: "",
    estimatedDeliveryDate: "",
    shippingNotes: "",
  });
  const [srBusyOrderId, setSrBusyOrderId] = useState<string | null>(null);
  const [srCouriers, setSrCouriers] = useState<any[]>([]);
  const [srContext, setSrContext] = useState<any>(null);
  const [srCourierLoading, setSrCourierLoading] = useState(false);
  const [srAssigningId, setSrAssigningId] = useState<number | null>(null);
  const [srCourierModalOrder, setSrCourierModalOrder] = useState<any>(null);
  const [srTab, setSrTab] = useState<
    "recommended" | "surface" | "air" | "all"
  >("recommended");

  const updateOrderInList = (orderId: string, patch: Record<string, any>) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, ...patch } : o)),
    );
    if (viewingOrder?._id === orderId) {
      setViewingOrder((prev: any) => (prev ? { ...prev, ...patch } : prev));
    }
    if (trackingOrder?._id === orderId) {
      setTrackingOrder((prev: any) => (prev ? { ...prev, ...patch } : prev));
    }
  };

  const handleShiprocketPush = async (orderId: string) => {
    setSrBusyOrderId(orderId);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shiprocket/push`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Pushed to Shiprocket");
        updateOrderInList(orderId, {
          shiprocket: {
            ...(orders.find((o) => o._id === orderId)?.shiprocket || {}),
            orderId: data.srOrderId,
            shipmentId: data.shipmentId,
            status: "pushed",
            lastError: null,
          },
          awbNumber: data.awbCode || undefined,
          courierName: data.courierName || undefined,
        });
      } else {
        toast.error(data.error || "Push failed");
        updateOrderInList(orderId, {
          shiprocket: {
            ...(orders.find((o) => o._id === orderId)?.shiprocket || {}),
            status: "failed",
            lastError: data.error,
          },
        });
      }
    } catch (e: any) {
      toast.error(e?.message || "Push failed");
    } finally {
      setSrBusyOrderId(null);
    }
  };

  const handleShiprocketRefresh = async (orderId: string) => {
    setSrBusyOrderId(orderId);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shiprocket/refresh`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Tracking refreshed");
        const t = data.tracking || {};
        const patch: Record<string, any> = {};
        if (t.awb) patch.awbNumber = t.awb;
        if (t.courierName) patch.courierName = t.courierName;
        if (t.trackUrl) patch.trackingLink = t.trackUrl;
        if (t.expectedDelivery)
          patch.estimatedDeliveryDate = t.expectedDelivery;
        updateOrderInList(orderId, patch);
      } else {
        toast.error(data.error || "Refresh failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Refresh failed");
    } finally {
      setSrBusyOrderId(null);
    }
  };

  const openCourierModal = async (order: any) => {
    setSrCourierModalOrder(order);
    setSrCouriers([]);
    setSrContext(null);
    setSrTab("recommended");
    setSrCourierLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${order._id}/shiprocket/couriers`,
      );
      const data = await res.json();
      if (res.ok) {
        setSrCouriers(data.couriers || []);
        setSrContext(data.context || null);
        if (!data.couriers?.length) {
          toast.error("No couriers available for this pincode/weight");
        }
      } else {
        toast.error(data.error || "Failed to load couriers");
        setSrCourierModalOrder(null);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load couriers");
      setSrCourierModalOrder(null);
    } finally {
      setSrCourierLoading(false);
    }
  };

  const closeCourierModal = () => {
    setSrCourierModalOrder(null);
    setSrCouriers([]);
    setSrContext(null);
  };

  const handleAssignAwb = async (orderId: string, courierId: number) => {
    setSrAssigningId(courierId);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shiprocket/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courierId }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(`AWB assigned: ${data.awbCode}`);
        updateOrderInList(orderId, {
          awbNumber: data.awbCode,
          courierName: data.courierName,
        });
        closeCourierModal();
      } else {
        toast.error(data.error || "AWB assignment failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "AWB assignment failed");
    } finally {
      setSrAssigningId(null);
    }
  };

  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("Processing");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [backwardConfirm, setBackwardConfirm] = useState<{ orderId: string; currentStatus: string; newStatus: string } | null>(null);
  const bulkEnabled = statusFilter !== "All";

  // Get allowed forward statuses for bulk (no Shipping, no backward)
  const bulkAllowedStatuses = useMemo(() => {
    if (!bulkEnabled) return [];
    const currentIndex = ORDER_STAGES.indexOf(statusFilter);
    return ORDER_STAGES.filter((s, i) => i > currentIndex && s !== "Shipping");
  }, [statusFilter, bulkEnabled]);

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedOrders(new Set());
    setBulkStatus("");
  }, [statusFilter]);

  // Set default bulk status when allowed statuses change
  useEffect(() => {
    if (bulkAllowedStatuses.length > 0) {
      setBulkStatus(bulkAllowedStatuses[0]);
    }
  }, [bulkAllowedStatuses]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      const normalizedData = data.map((order: any) => ({
        ...order,
        status: order.status || (order.isDelivered ? "Delivered" : "Pending"),
      }));
      setOrders(normalizedData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;

    // Check if moving backward
    const currentIndex = ORDER_STAGES.indexOf(order.status);
    const newIndex = ORDER_STAGES.indexOf(newStatus);
    if (newIndex < currentIndex) {
      setBackwardConfirm({ orderId, currentStatus: order.status, newStatus });
      return;
    }

    if (newStatus === "Shipping") {
      setTrackingOrder(order);
      setTrackingData({
        courierName: order?.courierName || "",
        awbNumber: order?.awbNumber || "",
        trackingLink: order?.trackingLink || "",
        estimatedDeliveryDate: order?.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0] : "",
        shippingNotes: order?.shippingNotes || "",
      });
      setTrackingModalOpen(true);
      return;
    }

    await executeStatusChange(orderId, newStatus);
  };

  const executeStatusChange = async (orderId: string, newStatus: string) => {
    const previousOrders = [...orders];
    const updatedOrders = orders.map((o) =>
      o._id === orderId ? { ...o, status: newStatus } : o,
    );
    setOrders(updatedOrders);

    if (viewingOrder?._id === orderId) {
      setViewingOrder({ ...viewingOrder, status: newStatus });
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      setOrders(previousOrders);
      if (viewingOrder?._id === orderId) {
        setViewingOrder(viewingOrder);
      }
      toast.error("Failed to update status");
    }
  };

  const confirmBackwardChange = async () => {
    if (!backwardConfirm) return;
    const { orderId, newStatus } = backwardConfirm;
    setBackwardConfirm(null);

    if (newStatus === "Shipping") {
      const order = orders.find((o) => o._id === orderId);
      setTrackingOrder(order);
      setTrackingData({
        courierName: order?.courierName || "",
        awbNumber: order?.awbNumber || "",
        trackingLink: order?.trackingLink || "",
        estimatedDeliveryDate: order?.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0] : "",
        shippingNotes: order?.shippingNotes || "",
      });
      setTrackingModalOpen(true);
      return;
    }

    await executeStatusChange(orderId, newStatus);
  };

  const handleSaveTracking = async () => {
    if (!trackingOrder) return;
    const orderId = trackingOrder._id;
    const newStatus = "Shipping";

    const previousOrders = [...orders];
    const updatedOrders = orders.map((o) =>
      o._id === orderId ? { ...o, status: newStatus, ...trackingData } : o,
    );
    setOrders(updatedOrders);

    if (viewingOrder?._id === orderId) {
      setViewingOrder({ ...viewingOrder, status: newStatus, ...trackingData });
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...trackingData }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Tracking info saved and status updated to ${newStatus}`);
      setTrackingModalOpen(false);
      setTrackingOrder(null);
    } catch (err) {
      setOrders(previousOrders);
      if (viewingOrder?._id === orderId) {
        setViewingOrder(previousOrders.find(o => o._id === viewingOrder._id) || viewingOrder);
      }
      toast.error("Failed to update status and tracking info");
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map((o: any) => o._id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedOrders.size === 0 || !bulkStatus) return;

    const stageIndex = ORDER_STAGES.indexOf(bulkStatus);

    // Block backward status changes
    const backwardOrders = orders.filter(
      (o) => selectedOrders.has(o._id) && ORDER_STAGES.indexOf(o.status) > stageIndex
    );
    if (backwardOrders.length > 0) {
      toast.error(
        `${backwardOrders.length} order${backwardOrders.length > 1 ? "s" : ""} already past "${bulkStatus}". Bulk update only moves orders forward.`
      );
      return;
    }

    // Filter out orders already at the target status
    const eligibleIds = orders
      .filter((o) => selectedOrders.has(o._id) && o.status !== bulkStatus)
      .map((o) => o._id);

    if (eligibleIds.length === 0) {
      toast.error("All selected orders are already at this status.");
      return;
    }

    setBulkUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: eligibleIds,
          status: bulkStatus,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${eligibleIds.length} order${eligibleIds.length > 1 ? "s" : ""} updated to ${bulkStatus}`);
      setSelectedOrders(new Set());
      await fetchOrders();
    } catch (err) {
      toast.error("Failed to update orders");
    } finally {
      setBulkUpdating(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress.fullName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (order.shippingAddress.email &&
          order.shippingAddress.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.user?.email &&
          order.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.user?.name &&
          order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.shippingAddress.phone &&
          order.shippingAddress.phone.includes(searchTerm));

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      let matchesDate = true;
      if (dateRange !== "AllTime") {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        if (dateRange === "Today") {
          matchesDate = orderDate.toDateString() === today.toDateString();
        } else if (dateRange === "Week") {
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= lastWeek;
        } else if (dateRange === "Month") {
          const lastMonth = new Date(
            today.getTime() - 30 * 24 * 60 * 60 * 1000,
          );
          matchesDate = orderDate >= lastMonth;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.isPaid)
      .reduce((acc, o) => acc + o.totalPrice, 0);
    const activeOrders = orders.filter((o) => o.status !== "Delivered").length;
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === new Date().toDateString(),
    ).length;

    return {
      totalRevenue,
      activeOrders,
      todayOrders,
      totalOrders: orders.length,
    };
  }, [orders]);

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedOrders,
    setCurrentPage,
    totalItems,
    itemsPerPage,
  } = usePagination(filteredOrders, 15);

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Enhanced Stats */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[2rem] sm:rounded-[32px] shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-[8px] sm:text-[10px] block mb-2">
              Order Management
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-primary-dark text-balance leading-tight">
              Orders Dashboard
            </h1>
            <p className="text-gray-400 font-medium mt-2 text-xs sm:text-sm">
              Manage and track all customer orders
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center">
                <IndianRupee className="text-primary" size={16} />
              </div>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                Total Revenue
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-number font-black text-primary-dark tabular-nums">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-medium">
              From {orders.filter((o) => o.isPaid).length} paid orders
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 sm:p-6 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Package className="text-blue-600" size={16} />
              </div>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                Active Orders
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-number font-black text-blue-600 tabular-nums">
              {stats.activeOrders}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-medium">
              Pending & in progress
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 sm:p-6 rounded-2xl border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-600" size={16} />
              </div>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                Today's Orders
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-number font-black text-green-600 tabular-nums">
              {stats.todayOrders}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-medium">
              New orders today
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[24px] shadow-sm border border-gray-100 flex flex-wrap items-center gap-3 sm:gap-4 sticky top-0 z-30 backdrop-blur-md bg-white/95">
        {/* Search */}
        <div className="relative flex-grow min-w-[200px] sm:min-w-[250px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by order ID, name, phone..."
            className="w-full bg-[#F5F5F5] border-none rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-xs sm:text-sm font-bold text-primary-dark focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow placeholder:text-gray-400 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg sm:rounded-xl overflow-x-auto no-scrollbar max-w-full">
          {["All", ...ORDER_STAGES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation ${
                statusFilter === s
                  ? "bg-white text-primary-dark shadow-sm"
                  : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex gap-2 bg-[#F5F5F5] p-1 rounded-lg sm:rounded-xl w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none w-full bg-white border-none rounded-md sm:rounded-lg py-1.5 sm:py-2 pl-2 sm:pl-3 pr-6 sm:pr-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary-dark outline-none cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
            >
              <option value="AllTime">All Time</option>
              <option value="Today">Today</option>
              <option value="Week">This Week</option>
              <option value="Month">This Month</option>
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={10}
            />
          </div>
        </div>
      </div>



      {/* Bulk Action Bar */}
      <AnimatePresence>
        {bulkEnabled && selectedOrders.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <span className="text-sm font-bold">
              {selectedOrders.size} {statusFilter} order{selectedOrders.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {bulkAllowedStatuses.length > 0 && (
                <>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="bg-white text-primary-dark rounded-lg px-3 py-2 text-sm font-bold outline-none cursor-pointer"
                  >
                    {bulkAllowedStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkStatusChange}
                    disabled={bulkUpdating}
                    className="bg-white text-primary font-bold text-sm px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {bulkUpdating ? "Updating..." : "Update All"}
                  </button>
                </>
              )}
              <a
                href={`/bulk-print?ids=${[...selectedOrders].join(",")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary font-bold text-sm px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Printer size={14} /> Print Thermal
              </a>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="text-white/80 hover:text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk info note */}
      {bulkEnabled && (
        <p className="text-xs text-gray-400 -mt-4">
          <span className="font-bold">Note:</span> &quot;Shipping&quot; status requires individual tracking info (AWB, courier) — use the per-order dropdown for shipping updates.
        </p>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F5F5F5] border-b border-gray-100">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {bulkEnabled && (
                  <th className="px-4 py-5 w-12">
                    <input
                      type="checkbox"
                      checked={paginatedOrders.length > 0 && selectedOrders.size === paginatedOrders.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </th>
                )}
                <th className="px-6 py-5">Order Details</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Items</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Order Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-8" colSpan={bulkEnabled ? 7 : 6}>
                        <div className="h-12 bg-gray-50 rounded-2xl w-full" />
                      </td>
                    </tr>
                  ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={bulkEnabled ? 7 : 6} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Package size={48} className="text-primary" />
                      <span className="text-sm font-black uppercase tracking-widest text-primary-dark">
                        No orders found
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <motion.tr
                    key={order._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-[#F5F5F5]/30 transition-colors"
                  >
                    {bulkEnabled && (
                      <td className="px-4 py-5 w-12">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order._id)}
                          onChange={() => toggleSelectOrder(order._id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>
                    )}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-primary-dark">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Calendar size={10} />
                          <span className="font-bold">
                            {mounted
                              ? new Date(order.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "..."}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-700">
                          {order.shippingAddress.fullName}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Phone size={10} />
                          <span className="font-medium">
                            {order.shippingAddress.phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center">
                          <FileText size={14} className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-gray-600">
                          {order.orderItems.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-black text-primary-dark tabular-nums">
                          ₹{order.totalPrice.toFixed(2)}
                        </span>
                        {order.couponCode && (
                          <span className="text-[9px] font-bold text-green-600 uppercase">
                            Coupon: {order.couponCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                          <CreditCard size={10} />
                          <span className="font-bold uppercase">
                            {order.paymentMethod}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block w-fit ${
                          order.isPaid
                            ? "text-green-600 bg-green-50"
                            : "text-amber-600 bg-amber-50"
                        }`}>
                          {order.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative max-w-[140px]">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          className={`appearance-none w-full bg-[#F5F5F5] border-none rounded-xl py-2.5 pl-3 pr-8 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 touch-manipulation ${
                            order.status === "Delivered"
                              ? "text-green-600"
                              : order.status === "Shipping"
                                ? "text-orange-600"
                                : order.status === "Processing"
                                  ? "text-blue-600"
                                  : "text-gray-500"
                          }`}
                        >
                          {ORDER_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          size={12}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <Link
                          href={`/orders/${order._id}/invoice?format=a4`}
                          target="_blank"
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                          title="Print A4 Invoice"
                        >
                          <Printer size={16} />
                        </Link>
                        <Link
                          href={`/orders/${order._id}/invoice?format=thermal`}
                          target="_blank"
                          className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                          title="Print Thermal Receipt"
                        >
                          <FileText size={16} />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid/List View */}
        <div className="lg:hidden divide-y divide-gray-100">
          {paginatedOrders.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-sm font-black text-primary-dark block leading-none">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">
                    {mounted
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "..."}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-base font-black text-primary-dark tabular-nums">
                    ₹{order.totalPrice.toFixed(2)}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 ${
                    order.isPaid
                      ? "text-green-600 bg-green-50"
                      : "text-amber-600 bg-amber-50"
                  }`}>
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </span>
                  <p className="text-[8px] font-bold text-gray-300 uppercase mt-0.5">
                    {order.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3 border-y border-gray-50 mb-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {order.shippingAddress.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-primary/5 text-primary text-[10px] font-black px-2 py-1 rounded-lg">
                    {order.orderItems.length} Items
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-grow">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className={`appearance-none w-full bg-[#F5F5F5] border-none rounded-xl py-2.5 pl-3 pr-8 text-[10px] font-black uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary/20 transition-all ${
                      order.status === "Delivered"
                        ? "text-green-600"
                        : order.status === "Shipping"
                          ? "text-orange-600"
                          : order.status === "Processing"
                            ? "text-blue-600"
                            : "text-gray-500"
                    }`}
                  >
                    {ORDER_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={14}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingOrder(order)}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-primary hover:bg-[#F5F5F5] transition-all shadow-sm"
                  >
                    <Eye size={18} />
                  </button>
                  <Link
                    href={`/orders/${order._id}/invoice?format=a4`}
                    target="_blank"
                    className="p-3 bg-white border border-gray-100 rounded-xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                    title="Print A4 Invoice"
                  >
                    <Printer size={18} />
                  </Link>
                  <Link
                    href={`/orders/${order._id}/invoice?format=thermal`}
                    target="_blank"
                    className="p-3 bg-white border border-gray-100 rounded-xl text-green-600 hover:bg-green-50 transition-all shadow-sm"
                    title="Print Thermal Receipt"
                  >
                    <FileText size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Order Detail Sidebar */}
      <AnimatePresence>
        {viewingOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-dark/80 backdrop-blur-sm z-[100]"
              onClick={() => setViewingOrder(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#F5F5F5] shadow-2xl z-[101] overflow-y-auto"
            >
              <div className="p-4 sm:p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 sm:mb-8">
                  <div className="flex-grow pr-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest inline-block mb-2 sm:mb-3">
                      Order Details
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-serif font-black text-primary-dark text-balance leading-tight">
                      #{viewingOrder._id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1 sm:mt-2">
                      {mounted
                        ? new Date(viewingOrder.createdAt).toLocaleString()
                        : "..."}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation shrink-0"
                  >
                    <X size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Status & Payment Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
                  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 relative">
                    <div className="flex items-center gap-3 mb-2 sm:mb-3">
                      <PackageCheck className="text-primary" size={18} />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Order Status
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={viewingOrder.status}
                        onChange={(e) =>
                          handleStatusChange(viewingOrder._id, e.target.value)
                        }
                        className={`appearance-none w-full bg-[#F5F5F5] border-none rounded-xl py-3 pl-4 pr-10 text-xl font-black uppercase tracking-widest cursor-pointer hover:bg-white transition-all focus-visible:ring-2 focus-visible:ring-primary/20 ${
                          viewingOrder.status === "Delivered"
                            ? "text-green-600"
                            : viewingOrder.status === "Shipping"
                              ? "text-orange-600"
                              : viewingOrder.status === "Processing"
                                ? "text-blue-600"
                                : "text-gray-500"
                        }`}
                      >
                        {ORDER_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={20}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2 sm:mb-3">
                      <CreditCard className="text-primary" size={18} />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Payment Status
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={viewingOrder.isPaid ? "text-green-600" : "text-amber-500"} size={24} />
                      <span className={`text-xl sm:text-2xl font-black uppercase tracking-widest ${viewingOrder.isPaid ? "text-green-600" : "text-amber-500"}`}>
                        {viewingOrder.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-2 font-black uppercase tracking-widest ml-1">
                      via {viewingOrder.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Shiprocket status row */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 mb-6 sm:mb-8">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <Truck className="text-primary shrink-0" size={18} />
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Shiprocket
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {(() => {
                            const sr = viewingOrder.shiprocket;
                            const status = sr?.status || "pending";
                            const styles: Record<string, string> = {
                              pushed: "bg-green-100 text-green-700",
                              pending: "bg-gray-100 text-gray-600",
                              failed: "bg-red-100 text-red-700",
                              cancelled: "bg-amber-100 text-amber-700",
                            };
                            return (
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded ${styles[status] || styles.pending}`}
                              >
                                {status}
                              </span>
                            );
                          })()}
                          {viewingOrder.shiprocket?.orderId && (
                            <span className="text-xs text-gray-500 font-mono">
                              SR #{viewingOrder.shiprocket.orderId}
                            </span>
                          )}
                        </div>
                        {viewingOrder.shiprocket?.lastError && (
                          <p className="text-[11px] text-red-600 mt-1 truncate max-w-md">
                            {viewingOrder.shiprocket.lastError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {(!viewingOrder.shiprocket?.orderId ||
                        viewingOrder.shiprocket?.status === "failed") && (
                        <button
                          onClick={() => handleShiprocketPush(viewingOrder._id)}
                          disabled={srBusyOrderId === viewingOrder._id}
                          className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          {srBusyOrderId === viewingOrder._id
                            ? "Pushing..."
                            : "Push to Shiprocket"}
                        </button>
                      )}
                      {viewingOrder.shiprocket?.shipmentId &&
                        !viewingOrder.awbNumber && (
                          <button
                            onClick={() => openCourierModal(viewingOrder)}
                            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                          >
                            Select courier &amp; ship
                          </button>
                        )}
                      {viewingOrder.shiprocket?.shipmentId && (
                        <button
                          onClick={() =>
                            handleShiprocketRefresh(viewingOrder._id)
                          }
                          disabled={srBusyOrderId === viewingOrder._id}
                          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          {srBusyOrderId === viewingOrder._id
                            ? "Syncing..."
                            : "Refresh tracking"}
                        </button>
                      )}
                    </div>
                  </div>

                  {viewingOrder.awbNumber && (
                    <div className="mt-3 text-xs text-gray-600">
                      AWB{" "}
                      <span className="font-mono font-semibold text-gray-800">
                        {viewingOrder.awbNumber}
                      </span>
                      {viewingOrder.courierName
                        ? ` · ${viewingOrder.courierName}`
                        : ""}
                    </div>
                  )}

                </div>

                {/* Customer Information */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 mb-6 sm:mb-8">
                  <h4 className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Customer Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                        <Mail size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Name
                        </p>
                        <p className="text-lg font-bold text-primary-dark">
                          {viewingOrder.shippingAddress.fullName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                        <Phone size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Phone
                        </p>
                        <p className="text-lg font-bold text-primary-dark">
                          {viewingOrder.shippingAddress.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                        <Mail size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Email
                        </p>
                        <p className="text-sm font-bold text-primary-dark">
                          {viewingOrder.shippingAddress.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Delivery Address
                        </p>
                        <p className="text-sm font-bold text-primary-dark leading-relaxed">
                          {viewingOrder.shippingAddress.address}
                          <br />
                          {viewingOrder.shippingAddress.city} -{" "}
                          {viewingOrder.shippingAddress.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 sm:mb-8">
                  <div className="p-4 sm:p-6 bg-[#F5F5F5] border-b border-gray-100">
                    <h4 className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Order Items
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {viewingOrder.orderItems.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 sm:p-4 flex gap-3 sm:gap-4 items-center"
                      >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden shrink-0 relative">
                          <Image
                            src={item.image}
                            className="object-cover"
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 48px, 64px"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs sm:text-sm font-black text-primary-dark truncate">
                            {item.name}
                          </p>
                          {item.uom && (
                            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                              {item.uom}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1">
                            ₹{item.price} × {item.qty}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm sm:text-lg font-black text-primary-dark tabular-nums">
                            ₹{(item.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="p-4 sm:p-6 bg-[#F5F5F5] space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-sm font-bold text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{viewingOrder.itemsPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-600">
                      <span>Shipping</span>
                      <span>₹{viewingOrder.shippingPrice.toFixed(2)}</span>
                    </div>
                    {viewingOrder.taxPrice > 0 && (
                      <div className="flex justify-between text-sm font-bold text-gray-600">
                        <span>Tax</span>
                        <span>₹{viewingOrder.taxPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {viewingOrder.discount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-green-600">
                        <span>
                          Discount
                          {viewingOrder.couponCode &&
                            ` (${viewingOrder.couponCode})`}
                        </span>
                        <span>-₹{viewingOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg sm:text-2xl font-black text-primary-dark pt-3 sm:pt-4 border-t-2 border-gray-200">
                      <span>Total</span>
                      <span className="tabular-nums">
                        ₹{viewingOrder.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link
                    href={`/orders/${viewingOrder._id}/invoice?format=a4`}
                    target="_blank"
                    className="flex-1 bg-primary text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:bg-primary-dark transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                  >
                    <Printer size={16} /> Print A4 Invoice
                  </Link>
                  <Link
                    href={`/orders/${viewingOrder._id}/invoice?format=thermal`}
                    target="_blank"
                    className="flex-1 bg-green-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:bg-green-700 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                  >
                    <FileText size={16} /> Print Thermal
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Backward Status Confirmation Modal */}
      <AnimatePresence>
        {backwardConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setBackwardConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertCircle size={24} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary-dark">Reverse Status Change</h3>
                  <p className="text-xs text-gray-400">This action may notify the customer</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to move this order from{" "}
                <span className="font-bold text-primary-dark">{backwardConfirm.currentStatus}</span> back to{" "}
                <span className="font-bold text-primary-dark">{backwardConfirm.newStatus}</span>?
                This is a backward status change and the customer will be notified.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBackwardConfirm(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBackwardChange}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
                >
                  Yes, Change Status
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      <AnimatePresence>
        {trackingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="absolute inset-0 bg-primary-dark/80 backdrop-blur-sm"
              onClick={() => setTrackingModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-primary mb-2">
                       <Truck size={20} />
                       <h3 className="text-xl font-serif font-black text-primary-dark">Courier Tracking Setup</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">
                      Configure tracking information for order <span className="font-bold text-primary">#{trackingOrder?._id?.slice(-8).toUpperCase()}</span>
                    </p>
                  </div>
                  <button onClick={() => setTrackingModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Courier Partner Name *</label>
                    <input
                      type="text"
                      placeholder="Enter courier partner name (e.g., Blue Dart, DTDC, FedEx)"
                      value={trackingData.courierName}
                      onChange={(e) => setTrackingData({...trackingData, courierName: e.target.value})}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark outline-none border border-transparent focus:border-primary/20 focus:bg-[#F5F5F5]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Tracking Number *</label>
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      value={trackingData.awbNumber}
                      onChange={(e) => setTrackingData({...trackingData, awbNumber: e.target.value})}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark outline-none border border-transparent focus:border-primary/20 focus:bg-[#F5F5F5]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Courier Tracking Link *</label>
                     <textarea
                      placeholder="https://courier-website.com/tracking?trackingNumber={trackingNumber}"
                      value={trackingData.trackingLink}
                      onChange={(e) => setTrackingData({...trackingData, trackingLink: e.target.value})}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark outline-none border border-transparent focus:border-primary/20 focus:bg-[#F5F5F5]/30 transition-colors min-h-[80px]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Use <span className="text-primary font-bold">{'{trackingNumber}'}</span> as placeholder for the tracking number</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Estimated Delivery Date (Optional)</label>
                    <input
                      type="date"
                      value={trackingData.estimatedDeliveryDate}
                      onChange={(e) => setTrackingData({...trackingData, estimatedDeliveryDate: e.target.value})}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark outline-none border border-transparent focus:border-primary/20 focus:bg-[#F5F5F5]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Additional Notes (Optional)</label>
                    <textarea
                      placeholder="Any additional information for the customer..."
                      value={trackingData.shippingNotes}
                      onChange={(e) => setTrackingData({...trackingData, shippingNotes: e.target.value})}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark outline-none border border-transparent focus:border-primary/20 focus:bg-[#F5F5F5]/30 transition-colors min-h-[80px]"
                    />
                  </div>
                </div>

                {trackingOrder && (
                  <div className="mt-6 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-600">
                      <span className="font-bold uppercase tracking-wider text-gray-400">
                        Shiprocket:
                      </span>{" "}
                      <span className="font-bold">
                        {trackingOrder.shiprocket?.status || "pending"}
                      </span>
                      {trackingOrder.shiprocket?.orderId && (
                        <span className="ml-2 font-mono">
                          #{trackingOrder.shiprocket.orderId}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(!trackingOrder.shiprocket?.orderId ||
                        trackingOrder.shiprocket?.status === "failed") && (
                        <button
                          type="button"
                          onClick={() =>
                            handleShiprocketPush(trackingOrder._id)
                          }
                          disabled={srBusyOrderId === trackingOrder._id}
                          className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          {srBusyOrderId === trackingOrder._id
                            ? "Pushing..."
                            : "Push to Shiprocket"}
                        </button>
                      )}
                      {trackingOrder.shiprocket?.shipmentId && (
                        <button
                          type="button"
                          onClick={() =>
                            handleShiprocketRefresh(trackingOrder._id)
                          }
                          disabled={srBusyOrderId === trackingOrder._id}
                          className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          {srBusyOrderId === trackingOrder._id
                            ? "Syncing..."
                            : "Refresh"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                   <button
                     onClick={() => setTrackingModalOpen(false)}
                     className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleSaveTracking}
                     disabled={!trackingData.courierName || !trackingData.awbNumber || !trackingData.trackingLink}
                     className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                   >
                     Save & Send Email
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select Courier Partner modal */}
      {srCourierModalOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/40">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">
                Select Courier Partner
              </h3>
              <button
                onClick={closeCourierModal}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row min-h-0 flex-1">
              {/* Order details */}
              <div className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 p-6 space-y-4 bg-gray-50/60">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Order Details
                </div>
                {srContext ? (
                  <div className="space-y-3">
                    {[
                      ["Pickup From", srContext.pickupPincode],
                      [
                        "Deliver To",
                        `${srContext.deliveryPincode}${srContext.deliveryState ? `, ${srContext.deliveryState}` : ""}`,
                      ],
                      ["Order Value", `₹${srContext.orderValue}`],
                      ["Payment Mode", srContext.paymentMethod],
                      ["Applicable Weight", `${srContext.weightKg} Kg`],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                          {label}
                        </div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">Loading…</div>
                )}
              </div>

              {/* Courier list */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-6 px-6 pt-4 border-b border-gray-100">
                  {(["recommended", "surface", "air", "all"] as const).map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setSrTab(t)}
                        className={`pb-3 text-sm font-bold capitalize border-b-2 -mb-px transition-colors ${
                          srTab === t
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {t}
                      </button>
                    ),
                  )}
                </div>

                <div className="p-6 overflow-auto flex-1">
                  {srCourierLoading ? (
                    <div className="text-center text-gray-400 py-12 text-sm">
                      Loading couriers…
                    </div>
                  ) : (
                    (() => {
                      const list = srCouriers.filter((c) =>
                        srTab === "surface"
                          ? c.mode === "Surface"
                          : srTab === "air"
                            ? c.mode === "Air"
                            : true,
                      );
                      if (!list.length) {
                        return (
                          <div className="text-center text-gray-400 py-12 text-sm">
                            No couriers found for this option.
                          </div>
                        );
                      }
                      return (
                        <>
                          <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5 mb-4">
                            <span className="text-sm leading-none mt-0.5">
                              🏅
                            </span>
                            <p className="text-[11px] text-green-800 leading-snug">
                              <span className="font-bold">
                                Best Performing couriers:
                              </span>{" "}
                              Recommended based on historical pickup &amp;
                              delivery performance for this pincode.
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 font-semibold mb-3">
                            {list.length} Couriers Found
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-sm border-separate border-spacing-y-2">
                              <thead>
                                <tr className="text-left text-[10px] font-black uppercase tracking-wide text-gray-400">
                                  <th className="py-1 pr-3">Courier Partner</th>
                                  <th className="py-1 px-3">Rating</th>
                                  <th className="py-1 px-3">Expected Pickup</th>
                                  <th className="py-1 px-3">
                                    Estimated Delivery
                                  </th>
                                  <th className="py-1 px-3">Chargeable Wt</th>
                                  <th className="py-1 px-3">Charges</th>
                                  <th className="py-1 pl-3">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {list.map((c) => (
                                  <tr
                                    key={c.courierCompanyId}
                                    className={`rounded-lg ${
                                      c.recommended
                                        ? "outline outline-1 outline-primary/40 bg-primary/5"
                                        : "border border-gray-100"
                                    }`}
                                  >
                                    <td className="py-3 pr-3 pl-3 rounded-l-lg align-top">
                                      {c.recommended && (
                                        <span className="inline-block text-[8px] font-black uppercase tracking-wide bg-primary text-white px-1.5 py-0.5 rounded mb-1">
                                          Recommended
                                        </span>
                                      )}
                                      <div className="font-bold text-gray-900">
                                        {c.courierName}
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        {c.mode}
                                        {c.minWeight != null
                                          ? ` | Min-weight: ${c.minWeight} Kg`
                                          : ""}
                                      </div>
                                      {c.rtoCharges != null && (
                                        <div className="text-[10px] text-gray-400">
                                          RTO Charges: ₹{c.rtoCharges}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3 px-3 align-middle">
                                      <RatingRing value={c.rating} />
                                    </td>
                                    <td className="py-3 px-3 align-middle text-gray-600">
                                      {c.expectedPickup || "—"}
                                    </td>
                                    <td className="py-3 px-3 align-middle text-gray-600">
                                      {c.etd ||
                                        (c.estimatedDeliveryDays
                                          ? `${c.estimatedDeliveryDays} days`
                                          : "—")}
                                    </td>
                                    <td className="py-3 px-3 align-middle text-gray-600">
                                      {c.chargeableWeight ??
                                        srContext?.weightKg}{" "}
                                      Kg
                                    </td>
                                    <td className="py-3 px-3 align-middle font-bold text-gray-900">
                                      ₹{c.rate}
                                    </td>
                                    <td className="py-3 px-3 pr-3 rounded-r-lg align-middle">
                                      <button
                                        onClick={() =>
                                          handleAssignAwb(
                                            srCourierModalOrder._id,
                                            c.courierCompanyId,
                                          )
                                        }
                                        disabled={srAssigningId !== null}
                                        className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 whitespace-nowrap"
                                      >
                                        {srAssigningId === c.courierCompanyId
                                          ? "Shipping…"
                                          : "Ship Now"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingRing({ value }: { value?: number }) {
  if (value == null || isNaN(value)) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  const pct = Math.max(0, Math.min(1, value / 5));
  const r = 16;
  const circ = 2 * Math.PI * r;
  const color = value >= 4 ? "#16a34a" : value >= 3 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-10 h-10">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-800">
        {value}
      </span>
    </div>
  );
}
