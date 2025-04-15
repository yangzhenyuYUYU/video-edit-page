// 气泡文字数据
export const bubbles = [
  {
    id: "bubble-1",
    name: "气泡1",
    type: "bubble",
    url: "https://res.chanjing.cc/public/res/bg/a10fb395-86f5-4e02-bdc3-da48ea07ae0e.png",
    content: "气泡文字1",
    textStyle: {
      color: "#FFFFFF",
      fontSize: 24,
      fontFamily: "MiSans",
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.5,
      WebkitTextStroke: "none",
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
    },
    categories: [{ id: "bubble-cat-1", name: "气泡" }],
    fav: 0,
    order: 1
  },
  {
    id: "bubble-2",
    name: "气泡2",
    type: "bubble",
    url: "https://res.chanjing.cc/public/res/bg/e396285e-97b6-4be6-bd71-e67b925d941e.png",
    content: "气泡文字2",
    textStyle: {
      color: "#FFFFFF",
      fontSize: 24,
      fontFamily: "MiSans",
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.5,
      WebkitTextStroke: "none",
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
    },
    categories: [{ id: "bubble-cat-1", name: "气泡" }],
    fav: 0,
    order: 2
  },
  {
    id: "bubble-3",
    name: "气泡3",
    type: "bubble",
    url:"https://res.chanjing.cc/public/res/bg/203aa1fb-bcb5-4a06-b83b-c2e78b914e9b.png",
    content: "气泡文字3",
    textStyle: {
      color: "#FFFFFF",
      fontSize: 24,
      fontFamily: "MiSans",
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.5,
      WebkitTextStroke: "none",
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
    },
    categories: [{ id: "bubble-cat-1", name: "气泡" }],
    fav: 0,
    order: 3
  },
  {
    id: "bubble-4",
    name: "气泡4",
    type: "bubble",
    url: "https://res.chanjing.cc/public/res/bg/76ce23fc-9f0d-436a-a993-f3325bf212aa.png",
    content: "气泡文字4",
    textStyle: {
      color: "#FFFFFF",
      fontSize: 24,
      fontFamily: "MiSans",
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.5,
      WebkitTextStroke: "none",
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
    },
    categories: [{ id: "bubble-cat-1", name: "气泡" }],
    fav: 0,
    order: 4
  },
  {
    id: "bubble-5",
    name: "气泡5",
    type: "bubble",
    url: "https://res.chanjing.cc/public/res/bg/918dc2b1-d110-483a-962e-9c77fc3204df.png",
    content: "气泡文字5",
    textStyle: {
      color: "#FFFFFF",
      fontSize: 24,
      fontFamily: "MiSans",
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.5,
      WebkitTextStroke: "none",
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
    },
    categories: [{ id: "bubble-cat-1", name: "气泡" }],
    fav: 0,
    order: 5
  }
];

// 根据分类组织数据
export const bubblesByCategory = {
  bubble: bubbles.filter(bubble => 
    bubble.categories.some(cat => cat.name === "气泡")
  )
};
