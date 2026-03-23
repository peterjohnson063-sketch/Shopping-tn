import 'package:flutter/material.dart';

import 'features/auth/login_page.dart';
import 'features/orders/orders_page.dart';
import 'services/location_service.dart';
import 'services/routing_service.dart';
import 'services/supabase_service.dart';
import 'state/driver_session.dart';

class EverestDeliveryApp extends StatefulWidget {
  const EverestDeliveryApp({super.key});

  @override
  State<EverestDeliveryApp> createState() => _EverestDeliveryAppState();
}

class _EverestDeliveryAppState extends State<EverestDeliveryApp> {
  late final DriverSession _session;
  late final RoutingService _routing;

  @override
  void initState() {
    super.initState();
    _session = DriverSession(
      api: SupabaseService(),
      locationService: LocationService(),
    );
    _routing = RoutingService();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Everest Delivery',
      theme: ThemeData(
        colorSchemeSeed: Colors.deepPurple,
        useMaterial3: true,
      ),
      home: AnimatedBuilder(
        animation: _session,
        builder: (_, __) {
          if (!_session.isLoggedIn) return LoginPage(session: _session);
          return OrdersPage(session: _session, routing: _routing);
        },
      ),
    );
  }
}
