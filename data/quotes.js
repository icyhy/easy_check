/**
 * 名人名言数据
 * 用于打卡页面的每日励志名言展示
 */

const quotes = [
  {
    text: "成功不是终点，失败不是末日，继续前进的勇气才最可贵。",
    author: "温斯顿·丘吉尔",
    category: "励志"
  },
  {
    text: "你今天的努力，是幸运的伏笔；当下的付出，是明日的花开。",
    author: "余秋雨",
    category: "努力"
  },
  {
    text: "不要等待机会，而要创造机会。",
    author: "拿破仑·希尔",
    category: "机会"
  },
  {
    text: "成功的秘诀在于坚持自己的目标和信念。",
    author: "本杰明·迪斯雷利",
    category: "坚持"
  },
  {
    text: "每一个不曾起舞的日子，都是对生命的辜负。",
    author: "尼采",
    category: "生活"
  },
  {
    text: "路漫漫其修远兮，吾将上下而求索。",
    author: "屈原",
    category: "求索"
  },
  {
    text: "天行健，君子以自强不息。",
    author: "《周易》",
    category: "自强"
  },
  {
    text: "宝剑锋从磨砺出，梅花香自苦寒来。",
    author: "古诗",
    category: "磨砺"
  },
  {
    text: "千里之行，始于足下。",
    author: "老子",
    category: "行动"
  },
  {
    text: "学而时习之，不亦说乎。",
    author: "孔子",
    category: "学习"
  },
  {
    text: "业精于勤，荒于嬉；行成于思，毁于随。",
    author: "韩愈",
    category: "勤奋"
  },
  {
    text: "山重水复疑无路，柳暗花明又一村。",
    author: "陆游",
    category: "希望"
  },
  {
    text: "落红不是无情物，化作春泥更护花。",
    author: "龚自珍",
    category: "奉献"
  },
  {
    text: "海纳百川，有容乃大；壁立千仞，无欲则刚。",
    author: "林则徐",
    category: "胸怀"
  },
  {
    text: "长风破浪会有时，直挂云帆济沧海。",
    author: "李白",
    category: "理想"
  },
  {
    text: "会当凌绝顶，一览众山小。",
    author: "杜甫",
    category: "志向"
  },
  {
    text: "人生如逆旅，我亦是行人。",
    author: "苏轼",
    category: "人生"
  },
  {
    text: "纸上得来终觉浅，绝知此事要躬行。",
    author: "陆游",
    category: "实践"
  },
  {
    text: "博观而约取，厚积而薄发。",
    author: "苏轼",
    category: "积累"
  },
  {
    text: "不积跬步，无以至千里；不积小流，无以成江海。",
    author: "荀子",
    category: "积累"
  },
  {
    text: "知之者不如好之者，好之者不如乐之者。",
    author: "孔子",
    category: "兴趣"
  },
  {
    text: "三人行，必有我师焉。",
    author: "孔子",
    category: "学习"
  },
  {
    text: "己所不欲，勿施于人。",
    author: "孔子",
    category: "品德"
  },
  {
    text: "富贵不能淫，贫贱不能移，威武不能屈。",
    author: "孟子",
    category: "品格"
  },
  {
    text: "天将降大任于斯人也，必先苦其心志。",
    author: "孟子",
    category: "磨砺"
  },
  {
    text: "生于忧患，死于安乐。",
    author: "孟子",
    category: "忧患"
  },
  {
    text: "吾生也有涯，而知也无涯。",
    author: "庄子",
    category: "学习"
  },
  {
    text: "君子坦荡荡，小人长戚戚。",
    author: "孔子",
    category: "品格"
  },
  {
    text: "有志者事竟成，破釜沉舟，百二秦关终属楚。",
    author: "蒲松龄",
    category: "志向"
  },
  {
    text: "苦心人天不负，卧薪尝胆，三千越甲可吞吴。",
    author: "蒲松龄",
    category: "坚持"
  }
];

/**
 * 获取今日名言
 * 基于日期生成固定的名言，确保同一天显示相同内容
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {object} 名言对象
 */
function getTodayQuote(date = '') {
  if (!date) {
    const now = new Date();
    date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  // 使用日期作为种子生成固定索引
  const seed = hashCode(date);
  const index = Math.abs(seed) % quotes.length;
  
  return quotes[index];
}

/**
 * 获取随机名言
 * @returns {object} 名言对象
 */
function getRandomQuote() {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

/**
 * 根据分类获取名言
 * @param {string} category - 分类名称
 * @returns {array} 名言数组
 */
function getQuotesByCategory(category) {
  return quotes.filter(quote => quote.category === category);
}

/**
 * 获取所有分类
 * @returns {array} 分类数组
 */
function getAllCategories() {
  const categories = [...new Set(quotes.map(quote => quote.category))];
  return categories;
}

/**
 * 字符串哈希函数
 * @param {string} str - 输入字符串
 * @returns {number} 哈希值
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

module.exports = {
  quotes,
  getTodayQuote,
  getRandomQuote,
  getQuotesByCategory,
  getAllCategories
};