import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { updateOrderStatus } from '../store/slices/ordersSlice';
import { getSocket } from '../services/socket';

/**
 * Подписывается на real-time события заказов через Socket.IO.
 * Вызывается в AppContent после авторизации.
 */
export function useSocketEvents() {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    if (!socket) return;

    // Смена статуса заказа
    const onStatus = (data: { orderId: string; status: string; orderNumber: string }) => {
      dispatch(updateOrderStatus({ orderId: data.orderId, status: data.status }));
      // TODO: показать toast
      console.log(`[Socket] Заказ ${data.orderNumber} → ${data.status}`);
    };

    // Пайплайн завершён
    const onPipelineDone = (data: any) => {
      dispatch(updateOrderStatus({ orderId: data.orderId, status: 'ASSESSED' }));
    };

    socket.on('order:status',       onStatus);
    socket.on('order:pipeline_done', onPipelineDone);

    return () => {
      socket.off('order:status',        onStatus);
      socket.off('order:pipeline_done', onPipelineDone);
    };
  }, [token]);
}
