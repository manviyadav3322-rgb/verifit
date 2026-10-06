"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function AnimatedCount({ value, suffix = "" }: { value: number; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 75, damping: 18, mass: 0.6 });
  const rounded = useTransform(spring, (latest) => `${Math.round(latest)}${suffix}`);
  useEffect(() => { motionValue.set(value); }, [motionValue, value]);
  return <motion.span>{rounded}</motion.span>;
}
