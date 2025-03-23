// 元素素材数据
export const elements = [
  {
    id: "f6d59fff5f3847f68bfc672c1d08edb5",
    name: "指引动画1",
    type: "material",
    url: "https://res.chanjing.cc/chanjing/static/uploadfile/2025-03-18/b2b63c01686f40c2b194c572304094c3.gif",
    direction: "vertical",
    width: 400,
    height: 400,
    categories: [{ id: "3688156c", name: "指引" }],
    fav: 0,
    order: 344
  },
  {
    id: "eb538024015a401697a73bc5985be386",
    name: "指引动画2",
    type: "material",
    url: "https://res.chanjing.cc/chanjing/static/uploadfile/2025-03-18/9f6e2262f3604f0c86125f0271feb21f.gif",
    direction: "vertical",
    width: 400,
    height: 400,
    categories: [{ id: "3688156c", name: "指引" }],
    fav: 0,
    order: 345
  },
  // ... 其他指引动画
  {
    id: "d99f895bd4c24f8fb6315a819220d61c",
    name: "点赞动画1",
    type: "material",
    url: "https://res.chanjing.cc/chanjing/static/uploadfile/2025-03-18/2037ea7f80e2449abcba47695a6a5eaf.gif",
    direction: "vertical",
    width: 400,
    height: 400,
    categories: [{ id: "7be6415f", name: "点赞关注" }],
    fav: 0,
    order: 333
  },
  {
    id: "792be7f2ea604de58ab0ca5442086cca",
    name: "点赞动画2",
    type: "material",
    url: "https://res.chanjing.cc/chanjing/static/uploadfile/2025-03-18/2bd8b7e0f035495e860091f420cd688b.gif",
    direction: "vertical",
    width: 400,
    height: 400,
    categories: [{ id: "7be6415f", name: "点赞关注" }],
    fav: 0,
    order: 334
  },
  // ... 其他点赞动画
  {
    id: "071f603f63ba4f8f94bd2ea8456f442f",
    name: "节日动画",
    type: "material",
    url: "https://res.chanjing.cc/chanjing/static/uploadfile/2025-01-22/af660e1cd40145528992b70598d129d7.gif",
    direction: "vertical",
    width: 400,
    height: 400,
    categories: [{ id: "f3f40157", name: "节日" }],
    fav: 0,
    order: 327
  }
];

// 根据图片所示的分类组织数据
export const elementsByCategory = {
  // 形状分类
  shape: elements.filter(element => 
    element.categories.some(cat => ["圆形", "方形", "三角形"].includes(cat.name))
  ),
  
  // 植物分类
  plant: elements.filter(element => 
    element.categories.some(cat => cat.name === "植物")
  ),
  
  // 边框分类
  border: elements.filter(element => 
    element.categories.some(cat => cat.name === "边框")
  ),
  
  // 桌椅分类
  furniture: elements.filter(element => 
    element.categories.some(cat => cat.name === "桌椅")
  ),
  
  // 蝴蝶logo分类
  butterflyLogo: elements.filter(element => 
    element.categories.some(cat => cat.name === "蝴蝶logo")
  ),
  
  // 遮挡分类
  mask: elements.filter(element => 
    element.categories.some(cat => cat.name === "遮挡")
  ),
  
  // 节日分类
  festival: elements.filter(element => 
    element.categories.some(cat => cat.name === "节日")
  ),
  
  // 指引分类
  guide: elements.filter(element => 
    element.categories.some(cat => cat.name === "指引")
  ),
  
  // 点赞关注分类
  social: elements.filter(element => 
    element.categories.some(cat => cat.name === "点赞关注")
  )
};

// 按照方向分类
export const elementsByDirection = {
  vertical: elements.filter(element => element.direction === "vertical"),
  horizontal: elements.filter(element => element.direction === "horizontal")
};

// 按照尺寸分类
export const elementsBySize = {
  small: elements.filter(element => element.width <= 200),
  medium: elements.filter(element => element.width > 200 && element.width <= 400),
  large: elements.filter(element => element.width > 400)
}; 