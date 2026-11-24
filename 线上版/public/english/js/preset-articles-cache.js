/* =====================================================================
 * Liora English · 预设阅读库全量离线精读缓存（100% 免 AI）
 * 覆盖：a-sleep / a-remote / a-bike / a-freeapps / a-sdg-intro
 * 搭配 sdg11-cache.js + ai-ethics-cache.js + ielts-words.js (9389 词)，
 * 实现全部内置阅读文章 100% 离线查词、离线翻译、离线长难句解析。
 * ===================================================================== */
(function () {
  'use strict';
  window.LIORA_LOCAL_CACHES = window.LIORA_LOCAL_CACHES || {};

  function pack(zh, struct, vocab) {
    return '1. 中文翻译：' + zh + '\n2. 句子主干与结构：' + struct + '\n3. 核心词汇与搭配：' + vocab;
  }

  window.LIORA_LOCAL_CACHES['a-sleep'] = {
    articleId: 'a-sleep',
    title: 'Why Your Brain Needs Sleep',
    words: {},
    analyze: {
      "For a long time, people believed that sleep was simply a way to rest the body.":
        pack("长久以来，人们认为睡眠只是让身体休息的一种方式。",
          "主干：people believed that...（宾语从句）；a way to rest the body 中不定式作后置定语。",
          "for a long time 长久以来；simply 仅仅；rest the body 让身体休息"),
      "Scientists now know that this idea is wrong.":
        pack("科学家们现在知道这种看法是错误的。",
          "主干：Scientists know that...（that 引导宾语从句）。",
          "idea 看法、观念"),
      "Sleep is an active process, and the brain uses these hours to do some of its most important work.":
        pack("睡眠是一个活跃的过程，大脑会利用这些时间来完成一些最重要的工作。",
          "and 连接两个并列分句；uses these hours to do... 为「利用时间做某事」。",
          "active process 活跃的过程；most important work 最重要的工作"),
      "One of the brain's nightly jobs is to decide which memories to keep.":
        pack("大脑每晚的任务之一就是决定保留哪些记忆。",
          "主干：One of... is to decide...（不定式作表语）；which memories to keep 为「疑问词+不定式」作宾语。",
          "nightly 每晚的；decide which... to keep 决定保留哪些……"),
      "During the day, your brain records everything that happens to you, but most of this information is useless.":
        pack("白天，大脑会记录发生在你身上的一切，但其中大部分信息都是无用的。",
          "but 表转折；that happens to you 为定语从句修饰 everything。",
          "record 记录；happen to sb. 发生在某人身上；useless 无用的"),
      "While you sleep, the brain replays the day and moves important experiences into long-term storage.":
        pack("当你入睡时，大脑会回放白天的经历，并将重要体验移入长期记忆库。",
          "While 引导时间状语从句；主句含两个并列谓语 replays 和 moves。",
          "replay 回放；long-term storage 长期储存"),
      "This is why students who sleep well after studying remember more than those who stay up late.":
        pack("这就是为什么学习后睡得好的学生比熬夜的学生记得更多。",
          "This is why... 表语从句；句中含两个 who 引导的定语从句，分别修饰 students 和 those。",
          "stay up late 熬夜；remember more 记得更多"),
      "Sleep also helps the brain clean itself.":
        pack("睡眠还能帮助大脑自我清洁。",
          "主干：Sleep helps the brain (to) clean itself。",
          "clean itself 自我清洁"),
      "Researchers have discovered a system that flushes waste products out of the nervous system during deep sleep.":
        pack("研究人员发现了一套系统，它能在深度睡眠期间将代谢废物冲出神经系统。",
          "that 引导定语从句修饰 a system；during deep sleep 作时间状语。",
          "flush... out of... 把……冲出……；waste products 代谢废物；nervous system 神经系统；deep sleep 深度睡眠"),
      "Some of these waste products are linked to diseases of the brain, which may explain why people who sleep too little for many years face a higher risk of memory problems.":
        pack("其中一些代谢废物与脑部疾病有关，这或许能解释为什么常年睡眠不足的人面临更高的记忆力问题风险。",
          "主干：Some... are linked to diseases；which 引导非限制性定语从句修饰前面整句话；why 引导宾语从句，内嵌 who 引导的定语从句修饰 people。",
          "be linked to 与……有关；face a higher risk of 面临更高的……风险；memory problems 记忆问题"),
      "The effects of missing sleep appear quickly.":
        pack("睡眠不足的影响会迅速显现。",
          "主干：The effects appear quickly；of missing sleep 作后置定语。",
          "missing sleep 缺少睡眠；appear quickly 迅速显现"),
      "After one bad night, most people find it harder to concentrate, and their reactions become slower.":
        pack("只要一夜没睡好，大多数人就会发现更难集中注意力，反应也会变慢。",
          "find it harder to concentrate 中 it 为形式宾语，真正的宾语是 to concentrate。",
          "find it + adj. + to do 发现做某事……；concentrate 集中注意力；reaction 反应"),
      "Studies show that going without sleep for eighteen hours affects driving ability in a way similar to drinking alcohol.":
        pack("研究表明，连续 18 小时不睡觉对驾驶能力的影响与饮酒相似。",
          "动名词短语 going without sleep for eighteen hours 作宾语从句主语；similar to drinking alcohol 作后置定语修饰 way。",
          "go without sleep 不睡觉；driving ability 驾驶能力；similar to 与……相似"),
      "Worse, people rarely notice how much their own performance has dropped.":
        pack("更糟糕的是，人们很少察觉到自己的表现下降了多少。",
          "Worse 为句首评注副词；how much 引导宾语从句作 notice 的宾语。",
          "rarely 很少；notice 察觉；performance 表现；drop 下降"),
      "Caffeine, the world's most popular drug, can also quietly damage sleep.":
        pack("咖啡因——世界上最受欢迎的提神物质——也会悄无声息地破坏睡眠。",
          "the world's most popular drug 为 Caffeine 的同位语；主干：Caffeine can damage sleep。",
          "caffeine 咖啡因；quietly 悄悄地；damage sleep 破坏睡眠"),
      "Coffee taken in the afternoon may not stop you from falling asleep, but it reduces the deep sleep that does most of the repair work.":
        pack("下午喝的咖啡可能不会阻止你入睡，但它会减少承担大部分修复工作的深度睡眠。",
          "过去分词短语 taken in the afternoon 作后置定语修饰 Coffee；that does most of the repair work 为定语从句修饰 deep sleep。",
          "stop sb. from doing 阻止某人做……；fall asleep 入睡；repair work 修复工作"),
      "Cutting off caffeine after lunch is one of the fastest ways to improve sleep quality.":
        pack("午饭后停止摄入咖啡因是提高睡眠质量最快的方法之一。",
          "动名词短语 Cutting off caffeine after lunch 作主语；to improve sleep quality 作 ways 的后置定语。",
          "cut off 停止/切断；sleep quality 睡眠质量"),
      "Fortunately, better sleep does not require expensive equipment.":
        pack("幸运的是，改善睡眠并不需要昂贵的设备。",
          "主干：better sleep does not require expensive equipment。",
          "fortunately 幸运的是；require 需要；expensive equipment 昂贵设备"),
      "Experts recommend going to bed and waking up at the same time every day, including weekends.":
        pack("专家建议每天（包括周末）都在同一时间上床睡觉和起床。",
          "recommend doing sth. 建议做某事（并列动名词 going... and waking...）。",
          "recommend 建议；at the same time 在同一时间；including 包括"),
      "They also suggest keeping the bedroom dark and cool, and avoiding bright screens for an hour before bed.":
        pack("他们还建议保持卧室昏暗凉爽，并在睡前一小时避免看明亮的电子屏幕。",
          "suggest 后接两个并列动名词短语 keeping... 和 avoiding...；keep + 宾语 + 形容词宾补。",
          "keep... dark and cool 保持昏暗凉爽；bright screens 电子亮屏"),
      "Perhaps the most difficult advice is also the simplest: if you cannot fall asleep, get up and do something calm instead of lying in bed and worrying.":
        pack("也许最难做到的一条建议恰恰也是最简单的：如果睡不着，就起身做点平静的事，而不是躺在床上干着急。",
          "冒号后为同位解释；if 引导条件状语从句，主句为祈使句 get up and do...；instead of 后接动名词短语。",
          "instead of 而不是；lie in bed 躺在床上；calm 平静的")
    }
  };

  window.LIORA_LOCAL_CACHES['a-remote'] = {
    articleId: 'a-remote',
    title: 'Three Years of Remote Work: What Really Changed?',
    words: {},
    analyze: {
      "When millions of office workers were sent home in 2020, many companies expected the experiment to last a few weeks.":
        pack("2020 年数百万上班族被安排居家办公时，许多公司以为这场试验只会持续几周。",
          "When 引导时间状语从句（含被动语态 were sent home）；主句为 expect sb./sth. to do 结构。",
          "office workers 上班族；experiment 试验；last 持续"),
      "Three years later, a large share of those workers had not returned, and the argument about the future of the office had become one of the most heated topics in business.":
        pack("三年后，其中很大一部分员工仍未回到办公室，关于「办公室未来」的争论已成为商界最激烈的话题之一。",
          "and 连接两个过去完成时分句；about the future of the office 作 argument 的后置定语。",
          "a large share of 很大一部分；heated topics 激烈讨论的话题"),
      "The clearest winner of the change is time.":
        pack("这场变革中最大的赢家是时间。",
          "主干：The clearest winner is time。",
          "clearest winner 最明显的赢家"),
      "The average commuter used to spend between one and two hours a day in traffic, and that time simply disappeared for remote employees.":
        pack("普通通勤者过去每天要花一到两个小时在路上，而对远程员工来说，这段时间直接消失了。",
          "used to do 表示「过去常常」；and 连接并列结果分句。",
          "commuter 通勤者；in traffic 在交通拥堵/通勤中；remote employees 远程员工"),
      "Surveys consistently show that people would trade a part of their salary for the right to keep working from home.":
        pack("调查一再表明，人们愿意放弃一部分薪水，以换取继续居家办公的权利。",
          "that 引导宾语从句；trade A for B 意为「用 A 换取 B」；to keep working from home 作 right 的后置定语。",
          "consistently 一贯地；trade... for... 用……换取……；work from home 居家办公"),
      "However, the losses are harder to measure.":
        pack("然而，损失却更难衡量。",
          "主干：the losses are harder to measure（形容词+不定式主动表被动）。",
          "loss 损失；measure 衡量"),
      "Several studies suggest that random conversations, the kind that happen at the coffee machine or in a lift, are where new ideas often begin.":
        pack("多项研究表明，偶发的闲聊——比如发生在咖啡机旁或电梯里的那种——往往是新创意萌芽的地方。",
          "the kind that happen... 为 random conversations 的同位语（内嵌定语从句）；where 引导表语从句。",
          "random conversations 随机闲聊；coffee machine 咖啡机；lift 电梯"),
      "Companies that removed the office removed those accidents.":
        pack("取消办公室的公司，也一并抹去了这些偶然的灵感碰撞。",
          "that removed the office 为定语从句修饰 Companies；accidents 此处指「偶发的交流机会」。",
          "remove 取消、移除；accidents 偶发机会"),
      "Younger employees report the strongest effects, because they learn quickly by listening to experienced colleagues solve real problems.":
        pack("年轻员工反馈受到的影响最大，因为他们原本是通过旁听资深同事解决实际问题来快速成长的。",
          "because 引导原因状语从句；by listening to sb. do sth. 作方式状语。",
          "experienced colleagues 资深同事；solve real problems 解决实际问题"),
      "Managers have also discovered that trust works differently at a distance.":
        pack("管理者也发现，在远程距离下，信任的运作方式截然不同。",
          "that 引导宾语从句；at a distance 作状语，意为「隔着距离/远程」。",
          "trust 信任；at a distance 远程地"),
      "In an office, a manager can see who is working.":
        pack("在办公室里，经理一眼就能看到谁在工作。",
          "who is working 为宾语从句作 see 的宾语。",
          "manager 经理、管理者"),
      "At home, they cannot, and some responded by tracking mouse movements and keyboard activity.":
        pack("居家时他们看不到，于是有些人选择通过追踪鼠标移动和键盘活动来应对。",
          "they cannot 后省略了 see who is working；by tracking... 作方式状语。",
          "respond 回应、应对；track 追踪；keyboard activity 键盘活动"),
      "Research shows that this kind of monitoring usually reduces trust and increases stress, while employees judge each other mainly on results anyway.":
        pack("研究表明，这类监控通常会削弱信任、增加压力，而员工之间原本也主要看工作结果来互相评价。",
          "while 表对比（「而」）；judge... on results 意为「按结果评判」。",
          "monitoring 监控；reduce trust 削弱信任；increase stress 增加压力；judge on results 按结果评判"),
      "For individuals, the biggest change may be personal.":
        pack("对个人而言，最大的变化或许来自自身层面。",
          "For individuals 作状语；主干：the biggest change may be personal。",
          "individual 个人；personal 个人的、自身的"),
      "Remote work rewards people who can plan their own day and punishes those who cannot.":
        pack("远程办公奖赏那些能规划好自己一天的人，却会惩罚做不到这一点的人。",
          "并列谓语 rewards... and punishes...；两个 who 引导的定语从句分别修饰 people 和 those。",
          "reward 奖赏；punish 惩罚；plan one's own day 规划自己的一天"),
      "Without a boss walking past, self-discipline becomes the most valuable skill in the house, and the boundary between work and life has to be drawn by the worker rather than by the building clock.":
        pack("没有老板在身边走来走去，自律成了家里最宝贵的技能，工作与生活的边界也必须由员工自己划定，而不再靠办公楼的打卡钟。",
          "Without + 名词 + walking past（with/without 复合结构作状语）；and 连接两个并列分句；后半句用被动语态 has to be drawn by...；rather than 表取舍对比。",
          "self-discipline 自律；boundary 边界；rather than 而不是"),
      "The pattern that seems to work best is a mix: two or three days in the office for meetings and collaboration, and the rest at home for focused work.":
        pack("似乎最奏效的模式是混合制：每周两三天去办公室开会协作，其余时间在家专注办公。",
          "that seems to work best 为定语从句修饰 pattern；冒号后解释 a mix 的具体内容。",
          "pattern 模式；collaboration 协作；focused work 专注工作"),
      "The office, in other words, is changing from a place where work happens into a place where people meet.":
        pack("换句话说，办公室正从「干活的地方」转变为「人们相聚碰面的地方」。",
          "in other words 为插入语；change from A into B 结构；两个 where 均引导定语从句修饰 a place。",
          "in other words 换句话说；change from... into... 从……转变为……"),
      "Whether that model survives the next recession is a question nobody can answer yet.":
        pack("这种模式能否撑过下一次经济衰退，目前还没有人能给出答案。",
          "Whether 引导主语从句；nobody can answer yet 为省略 that 的定语从句修饰 a question。",
          "survive 熬过、幸存；recession 经济衰退")
    }
  };

  window.LIORA_LOCAL_CACHES['a-bike'] = {
    articleId: 'a-bike',
    title: 'The Cities That Build Highways for Bicycles',
    words: {},
    analyze: {
      "Ask an engineer from the 1960s how a modern city should move people around, and the answer would probably involve more roads and bigger car parks.":
        pack("如果你问一位 1960 年代的工程师现代城市该如何运送人群，答案多半是修更多马路和更大的停车场。",
          "「祈使句 + and + 陈述句」相当于「如果……那么……」；how 引导宾语从句作 Ask 的直接宾语。",
          "move people around 运送出行人群；involve 包含、涉及；car park 停车场"),
      "Ask a city planner today, and you may hear a surprising word: bicycle.":
        pack("而今天你问一位城市规划师，可能会听到一个令人意外的词：自行车。",
          "同样使用「祈使句 + and + 主句」结构，与前句形成鲜明对比。",
          "city planner 城市规划师；surprising 令人惊讶的"),
      "The change is most visible in northern Europe.":
        pack("这种变化在北欧最为明显。",
          "主干：The change is most visible（形容词最高级作表语）。",
          "visible 明显的、可见的；northern Europe 北欧"),
      "Cities such as Copenhagen and Amsterdam have spent thirty years building wide, protected bike lanes that are physically separated from car traffic.":
        pack("哥本哈根和阿姆斯特丹等城市花了三十年时间，修建宽阔且受保护、与机动车流物理隔离的自行车道。",
          "spend time doing sth. 花时间做某事；that are physically separated... 为定语从句修饰 bike lanes。",
          "protected bike lanes 受保护的自行车道；physically separated 物理隔离；car traffic 机动车流"),
      "The result is that in Copenhagen, more than half of journeys to work and education are now made by bicycle, in a country where it rains about 150 days a year.":
        pack("结果是，在一年约有 150 天下雨的丹麦，哥本哈根如今超过一半的通勤和通学出行都靠骑自行车完成。",
          "that 引导表语从句；are made by bicycle 为被动语态；where 引导定语从句修饰 a country。",
          "more than half of 超过一半的；journeys to work and education 通勤和通学出行"),
      "What makes these routes work is not paint.":
        pack("让这些路线真正奏效的，并不是地上的油漆标线。",
          "What makes these routes work 为 what 引导的主语从句。",
          "make... work 使……奏效；route 路线；paint 油漆标线"),
      "A line of white paint on a busy road does almost nothing, because most people are afraid of cars, not of cycling.":
        pack("在繁忙马路上画一条白线几乎毫无作用，因为大多数人害怕的是汽车，而不是骑车本身。",
          "because 引导原因状语从句；not of cycling 与 of cars 并列对比。",
          "busy road 繁忙道路；be afraid of 害怕……"),
      "The Dutch solution was to build elevated bike highways between cities and underground parking for thousands of bicycles at train stations.":
        pack("荷兰的解决方案是在城市之间修建高架自行车高速路，并在火车站建设可容纳数千辆自行车的地下停车场。",
          "不定式短语 to build... 作表语，含两个并列宾语 elevated bike highways 和 underground parking。",
          "elevated 高架的；underground parking 地下停车场"),
      "Cycling had to become faster and more convenient than driving before people would choose it.":
        pack("骑行必须变得比开车更快、更方便，人们才会选择它。",
          "before 引导时间/条件状语从句（意为「……之后才……」）；形容词比较级 faster and more convenient。",
          "convenient 方便的；choose 选择"),
      "The benefits go beyond traffic.":
        pack("它的好处远不止交通本身。",
          "go beyond 意为「超越、不止于」。",
          "benefit 益处；go beyond 超越"),
      "Bicycles take almost no space, so a bike lane can move several times more people per hour than a car lane of the same width.":
        pack("自行车几乎不占空间，因此一条自行车道每小时运送的人数是同宽机动车道的好几倍。",
          "so 连接因果分句；several times more... than... 为倍数比较结构。",
          "take almost no space 几乎不占空间；of the same width 同等宽度的"),
      "They produce no exhaust, and the daily exercise improves public health, which reduces the cost of medical care.":
        pack("它们不排放尾气，而且日常骑行锻炼还能改善公共健康，从而降低医疗成本。",
          "which 引导非限制性定语从句，指代前面「improves public health」这件事。",
          "exhaust 尾气；public health 公共健康；medical care 医疗保健"),
      "One study estimated that the health savings from regular cycling are larger than the risks from accidents by a factor of about twenty to one.":
        pack("一项研究估算，经常骑行带来的健康收益大约是事故风险的二十倍。",
          "that 引导宾语从句；by a factor of about twenty to one 表示「大约 20 比 1 的倍数」。",
          "estimate 估算；health savings 健康节省/收益；by a factor of... 按……倍数"),
      "Of course, bicycles cannot solve everything.":
        pack("当然，自行车并不能解决所有问题。",
          "主干：bicycles cannot solve everything。",
          "of course 当然"),
      "They are less useful in very hot or very cold climates, for people with physical disabilities, and for moving heavy goods.":
        pack("在酷热或严寒气候下、对行动不便的人士，以及运输重物时，自行车的实用性较低。",
          "三个并列介词短语（in..., for..., and for...）作状语列举局限场景。",
          "climate 气候；physical disabilities 肢体残障；heavy goods 重物"),
      "But as one part of a transport system, alongside trains, buses and walking, they are by far the cheapest way to make a city more livable.":
        pack("但作为交通系统的一环，与火车、公交和步行相配合，自行车无疑是让城市更宜居的最廉价方式。",
          "as... 和 alongside... 为状语；by far 修饰最高级 the cheapest；to make a city more livable 作后置定语。",
          "transport system 交通系统；alongside 与……一起；by far 迄今为止/明显最；livable 宜居的"),
      "The lesson from Europe is that behaviour follows design.":
        pack("欧洲给我们的启示是：行为跟着设计走。",
          "that 引导表语从句；简短有力的主题句。",
          "lesson 启示、经验；behaviour follows design 行为随设计而变"),
      "People do not need to be persuaded to cycle; they need streets where cycling feels safe.":
        pack("人们并不需要被劝说去骑车；他们需要的是骑起来感觉安全的街道。",
          "分号连接对比两句；to be persuaded 为不定式被动式；where 引导定语从句修饰 streets。",
          "persuade 说服；feel safe 感觉安全"),
      "Cities that wait for a change of heart usually wait forever.":
        pack("坐等市民回心转意（主动改变观念）的城市，通常只能永远等下去。",
          "that wait for a change of heart 为定语从句修饰 Cities；前后两个 wait 形成修辞呼应。",
          "a change of heart 改变主意/观念转变；wait forever 永远等待")
    }
  };

  window.LIORA_LOCAL_CACHES['a-freeapps'] = {
    articleId: 'a-freeapps',
    title: 'If You Are Not Paying, You Are the Product',
    words: {},
    analyze: {
      "There is an old saying in the technology industry: if you are not paying for the product, you are the product.":
        pack("科技行业有一句老话：如果你没有为产品付费，那你本身就是产品。",
          "There is... 存在句；冒号后为同位解释（含 if 条件状语从句）。",
          "old saying 老话、名言；technology industry 科技行业"),
      "It means that a free service is rarely free.":
        pack("意思是，所谓免费服务几乎从来不是真正免费的。",
          "that 引导宾语从句；rarely 表否定含义「极少」。",
          "free service 免费服务；rarely 很少、几乎不"),
      "Somebody is paying, and that somebody is usually an advertiser who wants your attention.":
        pack("总有人在买单，而买单的人通常是想要获取你注意力的广告商。",
          "and 连接递进分句；who wants your attention 为定语从句修饰 an advertiser。",
          "advertiser 广告商；attention 注意力"),
      "The business model is simple to describe.":
        pack("这种商业模式说起来很简单。",
          "be + adj. + to do 主动表被动结构。",
          "business model 商业模式；describe 描述"),
      "A company builds something useful, such as a search engine, a map, or a social network, and gives it away.":
        pack("一家公司开发出有用的东西——比如搜索引擎、地图或社交网络——然后免费送给用户使用。",
          "such as... 举例插入语；并列谓语 builds... and gives it away。",
          "search engine 搜索引擎；social network 社交网络；give away 免费赠送"),
      "Millions of people arrive, and the company sells the chance to show them advertisements.":
        pack("数以百万计的用户涌入，于是公司便把向他们展示广告的机会卖出去。",
          "to show them advertisements 作 the chance 的后置定语。",
          "advertisement 广告；sell the chance 出售机会"),
      "The more time users spend inside the service, the more advertisements can be sold, so the product is quietly designed to be difficult to leave.":
        pack("用户在服务里停留的时间越长，能卖出的广告就越多，因此产品会被悄然设计得让人难以离开。",
          "The more..., the more...「越……越……」结构；so 引出结果分句（被动语态 is designed to be...）。",
          "spend time 停留/花费时间；quietly designed 悄然设计；difficult to leave 难以离开"),
      "For a long time, this trade seemed acceptable to most users.":
        pack("很长一段时间里，大多数用户似乎都能接受这种交换。",
          "seem acceptable to sb. 对某人来说显得可以接受。",
          "trade 交易、交换；acceptable 可接受的"),
      "Recently, however, the price has become clearer.":
        pack("然而最近，这种代价变得越来越清晰了。",
          "however 为转折插入语；price 此处引申为「隐性代价」。",
          "price 代价；clearer 更清晰的"),
      "Investigations have shown that some applications collect location data, contacts and even messages, and share them with third parties in ways that users never agreed to.":
        pack("调查显示，一些应用程序会收集定位数据、通讯录甚至聊天信息，并以用户从未同意的方式将其分享给第三方。",
          "that 引导宾语从句，内含并列谓语 collect... and share...；第二个 that 引导定语从句修饰 ways。",
          "investigation 调查；location data 定位数据；contacts 通讯录；third parties 第三方"),
      "A free weather app has no obvious reason to know your contacts.":
        pack("一款免费的天气应用没有任何正当理由去获取你的通讯录。",
          "to know your contacts 作 reason 的后置定语。",
          "obvious 明显的；weather app 天气应用"),
      "Regulators have begun to respond.":
        pack("监管机构已经开始采取行动。",
          "主干：Regulators have begun to respond（现在完成时）。",
          "regulator 监管机构；respond 作出回应"),
      "The European Union now requires companies to explain in plain language what data they collect and why, and to delete it on request.":
        pack("欧盟现在要求企业用通俗易懂的语言说明收集了哪些数据及原因，并在用户要求时予以删除。",
          "require sb. to do sth. 结构，含两个并列不定式 to explain... and to delete...；what data they collect and why 为宾语从句。",
          "European Union 欧盟；in plain language 用通俗语言；on request 应要求"),
      "Fines have reached billions of euros.":
        pack("罚款金额已高达数十亿欧元。",
          "主干：Fines have reached billions of euros。",
          "fine 罚款；billions of 数十亿"),
      "Whether these rules change company behaviour or only paperwork is still debated.":
        pack("这些规定究竟能改变企业行为，还是仅仅多了些纸面文书，目前仍有争议。",
          "Whether... or... 引导主语从句；is still debated 为一般现在时被动语态。",
          "company behaviour 企业行为；paperwork 文书工作；debate 争论"),
      "There is also a quieter alternative: pay for things.":
        pack("此外还有一个更低调的替代方案：花钱购买服务。",
          "冒号后为同位解释 alternative 的具体做法。",
          "alternative 替代方案；pay for 为……付费"),
      "A paid application has a customer rather than a product, and its interests point in a different direction.":
        pack("付费应用面对的是「客户」而不是「待售产品」，其利益指向也截然不同。",
          "rather than 表对比；point in a different direction 意为「指向不同方向」。",
          "paid application 付费应用；customer 客户；interests 利益"),
      "Paid services are usually smaller, show no advertisements, and treat the user as somebody to serve rather than somebody to sell.":
        pack("付费服务通常体量更小、没有广告，且把用户当成需要服务的对象，而不是可以出售的商品。",
          "三个并列谓语 are..., show..., and treat...；treat A as B「把 A 当作 B」；to serve / to sell 作 somebody 的后置定语。",
          "treat... as... 把……当作……；serve 服务"),
      "The question for each user is simple: what is your attention worth per month?":
        pack("留给每位用户的问题其实很简单：你的注意力每个月值多少钱？",
          "冒号后为具体设问；be worth + 价值 意为「值多少钱」。",
          "attention 注意力；per month 每月")
    }
  };

  window.LIORA_LOCAL_CACHES['a-sdg-intro'] = {
    articleId: 'a-sdg-intro',
    title: 'Introduction to the Sustainable Development Goals',
    words: {},
    analyze: {
      "Introduction to the Sustainable Development Goals (SDGs)":
        pack("联合国可持续发展目标（SDGs）简介",
          "名词短语标题：Introduction to...（……简介）。",
          "Sustainable Development Goals 可持续发展目标"),
      "Since their adoption in 2015, the United Nations Sustainable Development Goals (SDGs) have provided a global blueprint for addressing some of the world’s most pressing social, environmental, and economic challenges.":
        pack("自 2015 年通过以来，联合国可持续发展目标（SDGs）为应对全球最紧迫的社会、环境和经济挑战提供了一份全球蓝图。",
          "Since... 作时间状语配现在完成时 have provided；for addressing... 作 blueprint 的后置定语。",
          "adoption 通过、采纳；global blueprint 全球蓝图；pressing 紧迫的；address challenges 应对挑战"),
      "These 17 interconnected goals aim to eliminate poverty, protect the planet, and ensure prosperity for all by the year 2030.":
        pack("这 17 项相互关联的目标旨在 2030 年前消除贫困、保护地球，并确保全人类共享繁荣。",
          "aim to 后接三个并列动词原形 eliminate, protect, and ensure。",
          "interconnected 相互关联的；eliminate poverty 消除贫困；prosperity 繁荣"),
      "The SDGs build on decades of international development work, including the earlier Millennium Development Goals (MDGs), which guided global progress from 2000 to 2015.":
        pack("SDGs 建立在数十年国际发展工作的基础上，包括早期在 2000 至 2015 年间指导全球进步的千年发展目标（MDGs）。",
          "build on 建立在……基础上；which 引导非限制性定语从句修饰 MDGs。",
          "build on 建立于；Millennium Development Goals 千年发展目标；guide progress 引导进步"),
      "Unlike the MDGs, which focused mostly on developing nations, the SDGs are universal—they apply to all countries, regardless of income level.":
        pack("与主要关注发展中国家的 MDGs 不同，SDGs 具有普适性——无论收入水平高低，它们适用于所有国家。",
          "Unlike... 作对比状语（内嵌 which 非限制性定语从句）；破折号后解释 universal 的含义。",
          "universal 普适的；apply to 适用于；regardless of 无论、不管；income level 收入水平"),
      "This broad approach reflects a growing understanding that global problems like climate change, inequality, and resource depletion require cooperative solutions and shared responsibility among nations.":
        pack("这种广泛视角反映出日益增强的共识：气候变化、不平等和资源枯竭等全球问题需要各国合作解决并共担责任。",
          "that 引导同位语从句解释 understanding 的内容；like... 为举例介词短语。",
          "reflect 反映；resource depletion 资源枯竭；cooperative solutions 合作方案；shared responsibility 共同责任"),
      "Targets, Indicators, and Progress Monitoring of the SDGs":
        pack("可持续发展目标的具体指标、衡量标准与进展监测",
          "并列名词短语小标题。",
          "target 具体目标；indicator 指标；progress monitoring 进展监测"),
      "Each goal is supported by specific targets and indicators that help governments, businesses, and civil society measure progress and identify areas needing improvement.":
        pack("每项目标都配有具体子目标和衡量指标，帮助政府、企业和公民社会衡量进展并找出需要改进的领域。",
          "被动语态 is supported by...；that 引导定语从句修饰 targets and indicators；needing improvement 现在分词短语作定语修饰 areas。",
          "civil society 公民社会；measure progress 衡量进展；identify areas needing improvement 找出待改进领域"),
      "For example, Goal 1—No Poverty—includes targets such as reducing the proportion of people living on less than $1.90 a day and increasing access to basic services like education, healthcare, and social protection.":
        pack("例如，目标 1「消除贫困」包含诸多子目标，如降低每天生活费低于 1.90 美元的人口比例，以及扩大人们获取教育、医疗和社会保障等基本服务的渠道。",
          "破折号间为 Goal 1 的同位语；such as 后接两个并列动名词短语 reducing... and increasing...；living on... 作 people 的后置定语。",
          "proportion 比例；live on 靠……生活；access to 获取……的机会；social protection 社会保障"),
      "Similarly, Goal 13—Climate Action—urges countries to integrate climate change measures into national policies and strengthen resilience to climate-related disasters.":
        pack("类似地，目标 13「气候行动」敦促各国将应对气候变化的措施纳入国家政策，并增强抵御气候相关灾害的韧性。",
          "urge sb. to do 结构，含两个并列动词 integrate... and strengthen...。",
          "urge 敦促；integrate... into... 把……融入……；resilience 韧性、抗灾能力"),
      "These targets are monitored through data collection and reporting, which are essential for transparency and accountability.":
        pack("这些指标通过数据收集与报告进行监测，而这对保持透明度和问责制至关重要。",
          "are monitored 为被动语态；which 引导非限制性定语从句指代 data collection and reporting。",
          "monitor 监测；transparency 透明度；accountability 问责制"),
      "According to the UN’s 2023 Sustainable Development Report, while some progress has been made, many goals are off track due to ongoing global crises such as the COVID-19 pandemic, conflicts, and economic instability.":
        pack("根据联合国《2023 年可持续发展报告》，尽管取得了一些进展，但由于新冠疫情、冲突和经济动荡等持续性的全球危机，许多目标已偏离轨道。",
          "while 引导让步状语从句（「尽管」）；due to 引导原因状语；be off track 意为「偏离正轨」。",
          "off track 偏离轨道；due to 由于；economic instability 经济动荡"),
      "Interconnectedness and Holistic Approach of the SDG Framework":
        pack("SDG 框架的相互关联性与整体性方法",
          "名词短语小标题。",
          "interconnectedness 相互关联性；holistic approach 整体性方法"),
      "The SDGs are based on the principle of \"leaving no one behind,\" emphasizing the importance of inclusion, equity, and human rights.":
        pack("SDGs 以「不让任何人掉队」为原则，强调包容、公平与人权的重要性。",
          "be based on 基于……；现在分词短语 emphasizing... 作伴随状语。",
          "leave no one behind 不让任何人掉队；inclusion 包容；equity 公平"),
      "The framework recognises that issues like poverty, health, education, gender equality, and environmental protection are deeply connected.":
        pack("该框架认识到，贫困、健康、教育、性别平等和环境保护等议题彼此紧密相连。",
          "that 引导宾语从句；issues like... 作从句主语。",
          "recognise 认识到；gender equality 性别平等；deeply connected 紧密相连"),
      "For instance, improving access to clean water (Goal 6) directly affects public health (Goal 3), which in turn can improve educational outcomes (Goal 4) and economic productivity (Goal 8).":
        pack("例如，改善清洁饮用水获取（目标 6）直接影响公共卫生（目标 3），进而又能提升教育成效（目标 4）和经济生产率（目标 8）。",
          "动名词短语 improving... 作主语；which 引导非限制性定语从句；in turn 表示「进而、反过来」。",
          "in turn 进而；educational outcomes 教育成果；economic productivity 经济生产率"),
      "This interdependence means that progress in one area often supports progress in others, but also that failure in one area can hold back success in the rest.":
        pack("这种相互依存意味着，某一领域的进步往往能带动其他领域，但某一领域的受挫也会拖累其余目标的成功。",
          "means 后接由 but also 连接的两个并列 that 宾语从句。",
          "interdependence 相互依存；hold back 阻碍、拖累"),
      "Importantly, the SDGs encourage governments to take a holistic approach to development by addressing root causes, engaging diverse stakeholders, and tailoring strategies to local needs and contexts.":
        pack("重要的是，SDGs 鼓励各国政府采取整体性发展思路：解决根本原因、吸纳多元利益相关方，并因地制宜调整策略。",
          "encourage sb. to do 结构；by 后接三个并列动名词短语（addressing..., engaging..., and tailoring...）作方式状语。",
          "root causes 根本原因；diverse stakeholders 多元利益相关方；tailor... to... 根据……量身定制"),
      "Challenges and the Enduring Value of the SDGs":
        pack("SDGs 面临的挑战与持久价值",
          "名词短语小标题。",
          "enduring value 持久价值"),
      "Despite widespread international support, the implementation of the SDGs faces several challenges.":
        pack("尽管获得了广泛的国际支持，SDGs 的落实仍面临若干挑战。",
          "Despite 引导让步介词短语；主干：the implementation faces several challenges。",
          "despite 尽管；implementation 落实、实施"),
      "Funding gaps, political instability, lack of data, and uneven commitment across countries continue to hinder progress.":
        pack("资金缺口、政局动荡、数据匮乏以及各国投入不均持续阻碍着进展。",
          "四个并列名词短语作主语；continue to hinder 为谓语。",
          "funding gaps 资金缺口；uneven commitment 承诺/投入不均；hinder 阻碍"),
      "Furthermore, the impacts of climate change, global inequality, and ongoing humanitarian crises make the goals more urgent but also harder to achieve.":
        pack("此外，气候变化、全球不平等以及持续的人道主义危机带来的冲击，使这些目标更加紧迫，也更难实现。",
          "make + 宾语(the goals) + 并列形容词宾补(more urgent but also harder to achieve)。",
          "furthermore 此外；humanitarian crises 人道主义危机；urgent 紧迫的"),
      "Some critics argue that the SDGs are too ambitious or vague, while others stress that without stronger accountability systems and clearer timelines, they risk becoming symbolic rather than transformational.":
        pack("一些批评者认为 SDGs 过于宏大或含糊，另一些人则强调，如果缺乏更强有力的问责机制和更清晰的时间表，它们可能流于象征而难以带来真正变革。",
          "Some... while others... 经典学术对比句型；without... 介词短语表含蓄条件；risk doing sth. 冒着……的风险。",
          "ambitious 宏大的；vague 模糊的；symbolic 象征性的；transformational 变革性的"),
      "Nevertheless, the SDGs remain a valuable guiding framework.":
        pack("尽管如此，SDGs 依然是一套宝贵的指导框架。",
          "Nevertheless 转折副词；remain 作系动词。",
          "nevertheless 尽管如此；guiding framework 指导框架"),
      "They offer a shared language and vision for global cooperation, pushing nations to think long-term and act responsibly in the face of complex challenges.":
        pack("它们为全球合作提供了共同语言与愿景，推动各国在面对复杂挑战时进行长远思考并负责任地行动。",
          "现在分词短语 pushing nations to... 作结果/伴随状语；in the face of 意为「面对」。",
          "shared language 共同语言；think long-term 长远思考；in the face of 面对"),
      "If implemented effectively, the SDGs have the potential to create a more sustainable, just, and inclusive world for future generations.":
        pack("如果能够得到有效落实，SDGs 有潜力为子孙后代创造一个更加可持续、公正和包容的世界。",
          "If implemented effectively 为「连词+过去分词」省略状语从句（完整为 If they are implemented effectively）。",
          "have the potential to do 有潜力做某事；just 公正的；inclusive 包容的；future generations 子孙后代")
    }
  };
})();
