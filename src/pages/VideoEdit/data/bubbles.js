// 气泡文字数据
const bubbles = [
  {
    "id": "db5866f11c7d4719a7fa4cb08b8f375e",
    "name": "气泡文字",
    "struct": {
      "baseInfo": {
        "width": 408,
        "height": 107
      },
      "textInfo": {
        "top": 26,
        "left": 70,
        "color": "#FFFFFF",
        "right": 92,
        "bottom": 5,
        "content": "春节通知",
        "fontSize": 52,
        "textAlign": "center",
        "fontFamily": "MiSans-Regular",
        "fontWeight": 400,
        "strokeColor": "red",
        "strokeWidth": 0,
        "writingMode": "horizontal-tb"
      },
      "backgroundInfo": {
        "top": 56,
        "left": 76,
        "right": 90,
        "bottom": 50,
        "backgroundColor": "#808080",
        "images": {
          "1": "https://res.chanjing.cc/public/res/bg/5c4c21bf-da1a-4235-9698-6af3e253f845.png",
          "2": "https://res.chanjing.cc/public/res/bg/4801763b-6792-416d-8319-acaca7819af6.png",
          "3": "https://res.chanjing.cc/public/res/bg/9e4e8189-c578-448c-bc6d-8156b865ebd6.png",
          "4": "https://res.chanjing.cc/public/res/bg/0e390620-0c8e-483b-8edd-21576c5ccc89.png",
          "5": "https://res.chanjing.cc/public/res/bg/c7589a53-1761-4b3c-b4c7-f3513d3b6357.png",
          "6": "https://res.chanjing.cc/public/res/bg/4c4cf72c-38d7-49a1-a73d-6252e4c4efcf.png",
          "7": "https://res.chanjing.cc/public/res/bg/29cc6c1a-7e8f-4f85-bdf8-5180502c82a9.png",
          "8": "https://res.chanjing.cc/public/res/bg/f5064b4a-7802-4088-84de-1354034cf557.png",
          "9": "https://res.chanjing.cc/public/res/bg/ca4e45ea-6157-44e9-be85-c21dba21208c.png"
        }
      }
    },
    "type": "bubble",
    "url": "https://res.chanjing.cc/public/res/bg/a10fb395-86f5-4e02-bdc3-da48ea07ae0e.png",
    "width": 408,
    "height": 107,
    "categories": [{ id: "bubble-cat-1", name: "气泡" }]
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
const bubblesByCategory = {
  "气泡": bubbles.filter(bubble => 
    bubble.categories.some(cat => cat.name === "气泡")
  )
};

export { bubbles, bubblesByCategory };
