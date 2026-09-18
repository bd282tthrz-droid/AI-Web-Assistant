import "./style.css";
import { useState, useEffect } from "react";

const words = ["Processing...", "Analyzing...", "Computing...", "Evaluating...", "Pondering..."];

const TypewriterLoader = () => {
  const [wordIndex, setWordIndex] = useState(0); // 当前单词序号
  const [text, setText] = useState(""); // 当前显示的文本
  const [isDeleting, setIsDeleting] = useState(false); // 是否处于删除状态

  useEffect(() => {
    const currentFullWord = words[wordIndex];

    // 动态调整打字/删除速度
    const typingSpeed = isDeleting ? 10 : 50;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // 逐字打印
        setText(currentFullWord.substring(0, text.length + 1));

        // 如果完整打印了当前单词，停顿一段时间后开始删除
        if (text === currentFullWord) {
          setTimeout(() => setIsDeleting(true), 800); // 展示完整单词 1.5 秒
        }
      } else {
        // 逐字删除
        setText(currentFullWord.substring(0, text.length - 1));

        // 当删除完毕，切换到下一个单词
        if (text === "") {
          setIsDeleting(false);
          setWordIndex((prevIndex) => (prevIndex + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex]);

  return (
    <div style={styles.container}>
      <span style={styles.text}>{text}</span>
      <span style={styles.cursor}>|</span>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "start",
    alignItems: "center",
    width: "100%",
    fontSize: "14px",
    color: "#F26623"
  },
  text: {
    letterSpacing: "1px"
  },
  cursor: {
    marginLeft: "2px",
    animation: "blink 0.4s infinite",
    color: "#F26623"
  }
};

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleSheet);
}

const Thinking = () => {
  return (
    <div className="flex items-center gap-2 w-full px-4 my-3">
      <div className="loader"></div>
      <TypewriterLoader />
    </div>
  );
};

export default Thinking;
