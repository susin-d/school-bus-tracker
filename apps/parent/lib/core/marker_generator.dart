import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MarkerGenerator {
  static Future<BitmapDescriptor> createMarkerFromEmoji(
    String emoji, {
    double size = 120,
    double fontSize = 80,
  }) async {
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    textPainter.text = TextSpan(
      text: emoji,
      style: TextStyle(fontSize: fontSize),
    );

    textPainter.layout();

    // Draw a shadow/background for better visibility
    final paint = Paint()
      ..color = const Color(0xCCFFFFFF) // 80% White background for emoji contrast
      ..style = PaintingStyle.fill
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

    canvas.drawCircle(Offset(size / 2, size / 2), size / 2 - 10, paint);

    textPainter.paint(
      canvas,
      Offset((size - textPainter.width) / 2, (size - textPainter.height) / 2),
    );

    final image = await pictureRecorder.endRecording().toImage(
          size.toInt(),
          size.toInt(),
        );
    final data = await image.toByteData(format: ui.ImageByteFormat.png);

    if (data == null) {
      return BitmapDescriptor.defaultMarker;
    }

    return BitmapDescriptor.bytes(data.buffer.asUint8List());
  }
}
