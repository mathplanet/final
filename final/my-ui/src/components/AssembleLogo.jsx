import { motion } from "framer-motion";

export default function AssembleLogo() {
  const letters = "Assemble".split("");

  // 각 글자가 나타나는 stagger 애니메이션
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const letterVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="relative text-6xl font-extrabold cursor-pointer select-none flex"
      variants={container}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05, textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={letterVariant}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text"
        >
          {char}
        </motion.span>
      ))}

      {/* 밑줄 */}
      <motion.span
        className="absolute left-0 -bottom-1 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
