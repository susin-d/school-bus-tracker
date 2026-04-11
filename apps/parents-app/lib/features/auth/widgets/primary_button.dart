import 'package:flutter/material.dart';

class PrimaryButton extends StatefulWidget {
  const PrimaryButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.loadingText = 'Loading...',
    this.busy = false,
  });

  final String text;
  final String loadingText;
  final bool busy;
  final VoidCallback onPressed;

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = !widget.busy;

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        duration: const Duration(milliseconds: 110),
        curve: Curves.easeOut,
        scale: _pressed ? 0.985 : 1,
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            style: FilledButton.styleFrom(
              elevation: enabled ? 2 : 0,
              shadowColor: Theme.of(context).shadowColor.withValues(alpha: 0.18),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: enabled ? widget.onPressed : null,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              child: widget.busy
                  ? Row(
                      key: const ValueKey('loading'),
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2.2),
                        ),
                        const SizedBox(width: 10),
                        Text(widget.loadingText),
                      ],
                    )
                  : Text(
                      widget.text,
                      key: const ValueKey('label'),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
