import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/delivery_order.dart';
import '../../state/driver_session.dart';
import '../../services/routing_service.dart';

class OrdersPage extends StatelessWidget {
  const OrdersPage({
    super.key,
    required this.session,
    required this.routing,
  });

  final DriverSession session;
  final RoutingService routing;

  Color _statusColor(String status) {
    switch (status) {
      case 'delivered':
        return Colors.green;
      case 'out_for_delivery':
        return Colors.blue;
      case 'ready':
        return Colors.deepPurple;
      default:
        return Colors.orange;
    }
  }

  Future<void> _openOptimizedRoute(BuildContext context, DeliveryOrder o) async {
    if (o.vendorLat == null ||
        o.vendorLng == null ||
        o.deliveryLat == null ||
        o.deliveryLng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Missing coordinates for optimized route.')),
      );
      return;
    }
    await routing.openOptimizedRoute(
      originLat: o.vendorLat!,
      originLng: o.vendorLng!,
      destLat: o.deliveryLat!,
      destLng: o.deliveryLng!,
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: session,
      builder: (_, __) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Assigned Orders'),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: session.refreshOrders,
              ),
            ],
          ),
          body: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: session.orders.length,
            itemBuilder: (_, i) {
              final o = session.orders[i];
              final statusColor = _statusColor(o.status);
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('#${o.trackingNumber}', style: const TextStyle(fontWeight: FontWeight.w700)),
                          Chip(
                            label: Text(o.status),
                            backgroundColor: statusColor.withOpacity(0.15),
                            labelStyle: TextStyle(color: statusColor, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('${o.customerName} • ${o.phone}'),
                      Text('${o.wilaya} • ${o.address}'),
                      const SizedBox(height: 6),
                      Text(
                        'Total: ${NumberFormat.decimalPattern().format(o.total)} TND',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      Text(o.itemsLabel, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => _openOptimizedRoute(context, o),
                            icon: const Icon(Icons.route),
                            label: const Text('Optimized Route'),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => session.startGps(o),
                            icon: const Icon(Icons.gps_fixed),
                            label: const Text('Start GPS'),
                          ),
                          ElevatedButton(
                            onPressed: () => session.markOutForDelivery(o),
                            child: const Text('Out For Delivery'),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                            onPressed: () async {
                              final note = await showDialog<String>(
                                context: context,
                                builder: (ctx) {
                                  final ctrl = TextEditingController();
                                  return AlertDialog(
                                    title: const Text('Proof Note'),
                                    content: TextField(
                                      controller: ctrl,
                                      decoration: const InputDecoration(
                                        hintText: 'Recipient name / delivery note',
                                      ),
                                    ),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                      ElevatedButton(onPressed: () => Navigator.pop(ctx, ctrl.text), child: const Text('Save')),
                                    ],
                                  );
                                },
                              );
                              if (note != null) {
                                await session.markDelivered(o, note);
                              }
                            },
                            child: const Text('Delivered'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
