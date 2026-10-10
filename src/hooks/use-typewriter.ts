import { time } from "framer-motion";
import { useState, useEffect, useRef, useDeferredValue, useCallback } from "react";

export interface UseTypeWriterProps {
  inputText: string;
  speed?: number; // 每次追加字符的时间间隔，单位毫秒
  chunkSize?: number; // 每次追加的字符数
}
const useTypewriter = ({ inputText, speed = 30, chunkSize = 1 }: UseTypeWriterProps) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const animateRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const deferredData = useDeferredValue(displayText);
  const timeStartRef = useRef<number | null>(null);

  const handleTypewriter = useCallback(
    (time: number) => {
      if (currentIndexRef.current >= inputText.length) {
        setIsTyping(false);
        animateRef.current = null;
        return;
      }
      if (timeStartRef.current === null) timeStartRef.current = time;
      const timeDiff = time - timeStartRef.current;
      if (timeDiff >= speed) {
        const ticks = Math.floor(timeDiff / speed);
        timeStartRef.current += speed * ticks;
        currentIndexRef.current = Math.min(currentIndexRef.current + chunkSize * ticks, inputText.length);
        const nextText = inputText.slice(0, currentIndexRef.current);
        setDisplayText(nextText);
      }
      animateRef.current = requestAnimationFrame(handleTypewriter);
    },
    [inputText, speed, chunkSize]
  );
  useEffect(() => {
    if (animateRef.current) {
      cancelAnimationFrame(animateRef.current);
      animateRef.current = null;
    } // 如果动画已经在进行中，直接返回，避免重复启动
    currentIndexRef.current = 0;
    timeStartRef.current = null;

    if (inputText) {
      setIsTyping(true);
      setDisplayText(""); // 清空上一条消息的残留
      animateRef.current = requestAnimationFrame(handleTypewriter);
    }
    return () => {
      if (animateRef.current) {
        cancelAnimationFrame(animateRef.current);
        animateRef.current = null;
      }
    };
  }, [inputText, speed, chunkSize]); // 🔗 只有在输入文本、流速、流量发生质变时重置管道

  return { deferredData, isTyping };
};

export default useTypewriter;
