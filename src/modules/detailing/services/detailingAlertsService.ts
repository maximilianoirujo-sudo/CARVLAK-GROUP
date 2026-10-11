import { DetailingQuote, Appointment, StockItem, DetailingConfig } from '../../../types';
import { isActiveJob, getLocalDateString, formatLocalTime } from '../../../lib/formatters';

export interface DetailingAlert {
  id: string;
  type: 
    | 'unconfirmed_tomorrow'
    | 'started_not_checked_in'
    | 'delayed_work'
    | 'ready_not_notified'
    | 'delivered_unpaid'
    | 'quote_followup'
    | 'past_unclosed'
    | 'stock_shortage';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timeContext?: string;
  quoteId?: string;
  appointmentId?: string;
  stockItemId?: string;
  clientPhone?: string;
  clientName?: string;
  vehicleInfo?: string;
  actionType: 'confirm' | 'whatsapp' | 'checkin' | 'pay' | 'view_quote' | 'view_appointment' | 'restock';
}

export function computeDetailingAlerts(
  quotes: DetailingQuote[],
  appointments: Appointment[],
  stockItems: StockItem[],
  config: DetailingConfig,
  snoozedAlertIds: string[] = []
): DetailingAlert[] {
  const alerts: DetailingAlert[] = [];
  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Fecha de mañana en formato YYYY-MM-DD
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = getLocalDateString(tomorrow);

  const thresholds = config.alert_thresholds || {
    unconfirmed_hours_before: 24,
    late_checkin_minutes: 15,
    delayed_work_hours: 0,
    ready_not_notified_hours: 2,
    delivered_unpaid_hours: 1,
    quote_followup_days: 3,
    past_unclosed_hours: 12,
    stock_lead_days: 7
  };

  // Turnos activos de Detailing
  const detailingAppts = appointments.filter(
    (a) => a.business === 'detailing' && !a.is_archived && !a.voided_at && !a.is_blocked
  );

  // Cotizaciones activas
  const activeQuotes = quotes.filter((q) => isActiveJob(q));

  // 1. Turno de mañana sin confirmar
  detailingAppts.forEach((appt) => {
    const isTomorrow = appt.start_time.startsWith(tomorrowStr);
    const isUnconfirmed = appt.status !== 'Confirmado' || (appt.stage && appt.stage === 'Agendado');
    const wasConfirmedWa = appt.whatsapp_sent_log?.some((l) => l.template_key === 'confirm_appointment');

    if (isTomorrow && isUnconfirmed && !wasConfirmedWa) {
      const linkedQuote = activeQuotes.find((q) => q.appointment_id === appt.id || q.id === appt.quote_id);
      alerts.push({
        id: `alert-unconf-${appt.id}`,
        type: 'unconfirmed_tomorrow',
        severity: 'warning',
        title: 'Turno de mañana sin confirmar',
        description: `${appt.title || 'Turno'} para mañana a las ${formatLocalTime(appt.start_time)} hs`,
        timeContext: `Mañana ${formatLocalTime(appt.start_time)}`,
        appointmentId: appt.id,
        quoteId: linkedQuote?.id,
        clientName: linkedQuote?.client_name,
        clientPhone: linkedQuote?.client_phone,
        vehicleInfo: linkedQuote?.vehicle_info,
        actionType: 'whatsapp'
      });
    }
  });

  // 2. Turno que ya empezó y el auto no fue recibido
  detailingAppts.forEach((appt) => {
    const startTime = new Date(appt.start_time);
    const diffMinutes = (now.getTime() - startTime.getTime()) / 60000;
    const linkedQuote = activeQuotes.find((q) => q.appointment_id === appt.id || q.id === appt.quote_id);
    const isReceived = linkedQuote?.status === 'Recibido' || linkedQuote?.status === 'En proceso' || linkedQuote?.status === 'Control de calidad' || linkedQuote?.status === 'Listo para retirar' || linkedQuote?.status === 'Entregado y cobrado';

    if (diffMinutes >= thresholds.late_checkin_minutes && !isReceived && appt.status !== 'Cancelado' && appt.stage !== 'Cancelado' && appt.stage !== 'No vino') {
      // Solo si es de hoy o de las últimas 6 horas
      if (diffMinutes < 360) {
        alerts.push({
          id: `alert-not-received-${appt.id}`,
          type: 'started_not_checked_in',
          severity: 'critical',
          title: 'Turno iniciado sin recepción',
          description: `El turno inició hace ${Math.round(diffMinutes)} min y el vehículo no tiene check-in registrado.`,
          timeContext: `Inició ${formatLocalTime(appt.start_time)}`,
          appointmentId: appt.id,
          quoteId: linkedQuote?.id,
          clientName: linkedQuote?.client_name,
          clientPhone: linkedQuote?.client_phone,
          vehicleInfo: linkedQuote?.vehicle_info,
          actionType: 'checkin'
        });
      }
    }
  });

  // 3. Trabajo atrasado (se pasó la hora de fin y no está "Listo")
  activeQuotes.forEach((quote) => {
    if (quote.status === 'En proceso' || quote.status === 'Recibido' || quote.status === 'Control de calidad') {
      const appt = detailingAppts.find((a) => a.id === quote.appointment_id || a.quote_id === quote.id);
      if (appt) {
        const startTime = new Date(appt.start_time);
        const endTime = new Date(startTime.getTime() + (appt.duration_minutes || 180) * 60000);
        if (now.getTime() > endTime.getTime() + thresholds.delayed_work_hours * 3600000) {
          const hoursLate = Math.round((now.getTime() - endTime.getTime()) / 3600000);
          alerts.push({
            id: `alert-delayed-${quote.id}`,
            type: 'delayed_work',
            severity: 'critical',
            title: 'Trabajo atrasado',
            description: `${quote.vehicle_info} superó la hora estimada de finalización (${formatLocalTime(endTime)} hs) por ${hoursLate} hs.`,
            timeContext: `${hoursLate}h demorado`,
            quoteId: quote.id,
            appointmentId: appt.id,
            clientName: quote.client_name,
            clientPhone: quote.client_phone,
            vehicleInfo: quote.vehicle_info,
            actionType: 'view_appointment'
          });
        }
      }
    }
  });

  // 4. Auto listo hace más de X horas sin avisar al cliente
  activeQuotes.forEach((quote) => {
    if (quote.status === 'Listo para retirar') {
      const readyHistory = quote.history?.slice().reverse().find((h) => h.to_status === 'Listo para retirar');
      const readyAt = readyHistory ? new Date(readyHistory.timestamp) : new Date(quote.updated_at);
      const diffHours = (now.getTime() - readyAt.getTime()) / 3600000;
      const wasNotified = quote.whatsapp_sent_log?.some(
        (l) => l.template_key === 'car_ready' && new Date(l.sent_at).getTime() >= readyAt.getTime()
      );

      if (diffHours >= thresholds.ready_not_notified_hours && !wasNotified) {
        alerts.push({
          id: `alert-ready-wa-${quote.id}`,
          type: 'ready_not_notified',
          severity: 'warning',
          title: 'Auto listo sin aviso al cliente',
          description: `${quote.vehicle_info} está listo hace ${Math.round(diffHours)} hs y no se ha notificado por WhatsApp.`,
          timeContext: `Listo hace ${Math.round(diffHours)}h`,
          quoteId: quote.id,
          appointmentId: quote.appointment_id,
          clientName: quote.client_name,
          clientPhone: quote.client_phone,
          vehicleInfo: quote.vehicle_info,
          actionType: 'whatsapp'
        });
      }
    }
  });

  // 5. Auto entregado sin cobro registrado
  activeQuotes.forEach((quote) => {
    if (quote.status === 'Entregado y cobrado') {
      const totalPaid = (quote.payments || [])
        .filter((p) => !p.is_voided)
        .reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid < quote.total_amount) {
        const debt = quote.total_amount - totalPaid;
        alerts.push({
          id: `alert-unpaid-${quote.id}`,
          type: 'delivered_unpaid',
          severity: 'critical',
          title: 'Auto entregado con saldo pendiente',
          description: `${quote.vehicle_info} de ${quote.client_name} adeuda $U ${debt.toLocaleString('es-UY')}.`,
          timeContext: `Saldo: $U ${debt.toLocaleString('es-UY')}`,
          quoteId: quote.id,
          appointmentId: quote.appointment_id,
          clientName: quote.client_name,
          clientPhone: quote.client_phone,
          vehicleInfo: quote.vehicle_info,
          actionType: 'pay'
        });
      }
    }
  });

  // 6. Cotización enviada sin respuesta hace X días
  activeQuotes.forEach((quote) => {
    if (quote.status === 'Presupuesto Enviado') {
      const createdAt = new Date(quote.created_at);
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const wasFollowedUp = quote.whatsapp_sent_log?.some((l) => l.template_key === 'quote_followup');

      if (diffDays >= thresholds.quote_followup_days && !wasFollowedUp) {
        alerts.push({
          id: `alert-followup-${quote.id}`,
          type: 'quote_followup',
          severity: 'info',
          title: 'Cotización enviada sin seguimiento',
          description: `Presupuesto para ${quote.client_name} (${quote.vehicle_info}) enviado hace ${Math.floor(diffDays)} días.`,
          timeContext: `${Math.floor(diffDays)} días sin respuesta`,
          quoteId: quote.id,
          clientName: quote.client_name,
          clientPhone: quote.client_phone,
          vehicleInfo: quote.vehicle_info,
          actionType: 'whatsapp'
        });
      }
    }
  });

  // 7. Turno pasado que sigue sin cerrar
  detailingAppts.forEach((appt) => {
    const startTime = new Date(appt.start_time);
    const diffHours = (now.getTime() - startTime.getTime()) / 3600000;
    const linkedQuote = activeQuotes.find((q) => q.appointment_id === appt.id || q.id === appt.quote_id);
    const isOpen = !linkedQuote || (linkedQuote.status !== 'Entregado y cobrado' && linkedQuote.status !== 'Trabajo Completado' && linkedQuote.status !== 'Cancelado');

    if (diffHours >= thresholds.past_unclosed_hours && isOpen && appt.status !== 'Cancelado' && appt.stage !== 'Cancelado') {
      alerts.push({
        id: `alert-unclosed-${appt.id}`,
        type: 'past_unclosed',
        severity: 'warning',
        title: 'Turno pasado sin cerrar',
        description: `El turno de ${linkedQuote?.client_name || appt.title} del ${getLocalDateString(appt.start_time)} sigue abierto.`,
        timeContext: `Hace ${Math.floor(diffHours / 24)}d`,
        appointmentId: appt.id,
        quoteId: linkedQuote?.id,
        clientName: linkedQuote?.client_name,
        clientPhone: linkedQuote?.client_phone,
        vehicleInfo: linkedQuote?.vehicle_info,
        actionType: 'view_appointment'
      });
    }
  });

  // 8. Insumo por debajo de lo necesario para los turnos de la semana
  const upcomingWeekAppts = detailingAppts.filter((a) => {
    const d = new Date(a.start_time);
    const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= (thresholds.stock_lead_days || 7);
  });

  const estimatedNeeds: Record<string, number> = {};
  upcomingWeekAppts.forEach((appt) => {
    const linkedQuote = activeQuotes.find((q) => q.appointment_id === appt.id || q.id === appt.quote_id);
    if (linkedQuote) {
      const recipes = config.recipes_by_service || {};
      const cat = linkedQuote.vehicle_category || 'Mediano';
      linkedQuote.selected_services.forEach((s) => {
        const recipe = recipes[s.serviceId];
        if (recipe && recipe[cat]) {
          recipe[cat].forEach((r) => {
            estimatedNeeds[r.stock_item_id] = (estimatedNeeds[r.stock_item_id] || 0) + r.quantity;
          });
        }
      });
    }
  });

  stockItems.filter((s) => !s.is_archived).forEach((item) => {
    const needed = estimatedNeeds[item.id] || 0;
    if (item.quantity < item.min_stock || (needed > 0 && item.quantity < needed)) {
      alerts.push({
        id: `alert-stock-${item.id}`,
        type: 'stock_shortage',
        severity: item.quantity <= 0 ? 'critical' : 'warning',
        title: `Stock bajo: ${item.name}`,
        description: `Disponible: ${item.quantity} ${item.unit}. Necesario para la semana: ${needed > 0 ? needed : item.min_stock} ${item.unit}.`,
        timeContext: `${item.quantity}/${item.min_stock} ${item.unit}`,
        stockItemId: item.id,
        actionType: 'restock'
      });
    }
  });

  // Filtrar pospuestas (snoozed)
  return alerts.filter((a) => !snoozedAlertIds.includes(a.id));
}
