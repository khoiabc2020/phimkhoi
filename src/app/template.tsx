"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
            transition={{ 
                ease: [0.22, 1, 0.36, 1], 
                duration: 0.5,
                opacity: { duration: 0.4 },
                filter: { duration: 0.3 }
            }}
        >
            {children}
        </motion.div>
    );
}
