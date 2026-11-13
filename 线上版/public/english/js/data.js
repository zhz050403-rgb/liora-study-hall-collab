/* =========================================================
 * Liora English · 数据层
 * 1) 内置示例文章（原创，CEFR B2 难度，约 350-400 词）
 * 2) LLM 提示词模板（查词 / 翻译 / 长难句解析 / 写作四维批改 /
 *    口语陪练 / 口语反馈 / AI 生成文章）
 * ========================================================= */

const ARTICLES = [
  {
    id: 'a-sleep',
    title: 'Why Your Brain Needs Sleep',
    topic: '健康与科学',
    level: 'B2',
    source: '原创示例',
    paragraphs: [
      'For a long time, people believed that sleep was simply a way to rest the body. Scientists now know that this idea is wrong. Sleep is an active process, and the brain uses these hours to do some of its most important work.',
      'One of the brain\'s nightly jobs is to decide which memories to keep. During the day, your brain records everything that happens to you, but most of this information is useless. While you sleep, the brain replays the day and moves important experiences into long-term storage. This is why students who sleep well after studying remember more than those who stay up late.',
      'Sleep also helps the brain clean itself. Researchers have discovered a system that flushes waste products out of the nervous system during deep sleep. Some of these waste products are linked to diseases of the brain, which may explain why people who sleep too little for many years face a higher risk of memory problems.',
      'The effects of missing sleep appear quickly. After one bad night, most people find it harder to concentrate, and their reactions become slower. Studies show that going without sleep for eighteen hours affects driving ability in a way similar to drinking alcohol. Worse, people rarely notice how much their own performance has dropped.',
      'Caffeine, the world\'s most popular drug, can also quietly damage sleep. Coffee taken in the afternoon may not stop you from falling asleep, but it reduces the deep sleep that does most of the repair work. Cutting off caffeine after lunch is one of the fastest ways to improve sleep quality.',
      'Fortunately, better sleep does not require expensive equipment. Experts recommend going to bed and waking up at the same time every day, including weekends. They also suggest keeping the bedroom dark and cool, and avoiding bright screens for an hour before bed. Perhaps the most difficult advice is also the simplest: if you cannot fall asleep, get up and do something calm instead of lying in bed and worrying.'
    ]
  },
  {
    id: 'a-remote',
    title: 'Three Years of Remote Work: What Really Changed?',
    topic: '工作与社会',
    level: 'B2',
    source: '原创示例',
    paragraphs: [
      'When millions of office workers were sent home in 2020, many companies expected the experiment to last a few weeks. Three years later, a large share of those workers had not returned, and the argument about the future of the office had become one of the most heated topics in business.',
      'The clearest winner of the change is time. The average commuter used to spend between one and two hours a day in traffic, and that time simply disappeared for remote employees. Surveys consistently show that people would trade a part of their salary for the right to keep working from home.',
      'However, the losses are harder to measure. Several studies suggest that random conversations, the kind that happen at the coffee machine or in a lift, are where new ideas often begin. Companies that removed the office removed those accidents. Younger employees report the strongest effects, because they learn quickly by listening to experienced colleagues solve real problems.',
      'Managers have also discovered that trust works differently at a distance. In an office, a manager can see who is working. At home, they cannot, and some responded by tracking mouse movements and keyboard activity. Research shows that this kind of monitoring usually reduces trust and increases stress, while employees judge each other mainly on results anyway.',
      'For individuals, the biggest change may be personal. Remote work rewards people who can plan their own day and punishes those who cannot. Without a boss walking past, self-discipline becomes the most valuable skill in the house, and the boundary between work and life has to be drawn by the worker rather than by the building clock.',
      'The pattern that seems to work best is a mix: two or three days in the office for meetings and collaboration, and the rest at home for focused work. The office, in other words, is changing from a place where work happens into a place where people meet. Whether that model survives the next recession is a question nobody can answer yet.'
    ]
  },
  {
    id: 'a-bike',
    title: 'The Cities That Build Highways for Bicycles',
    topic: '城市与环境',
    level: 'B2',
    source: '原创示例',
    paragraphs: [
      'Ask an engineer from the 1960s how a modern city should move people around, and the answer would probably involve more roads and bigger car parks. Ask a city planner today, and you may hear a surprising word: bicycle.',
      'The change is most visible in northern Europe. Cities such as Copenhagen and Amsterdam have spent thirty years building wide, protected bike lanes that are physically separated from car traffic. The result is that in Copenhagen, more than half of journeys to work and education are now made by bicycle, in a country where it rains about 150 days a year.',
      'What makes these routes work is not paint. A line of white paint on a busy road does almost nothing, because most people are afraid of cars, not of cycling. The Dutch solution was to build elevated bike highways between cities and underground parking for thousands of bicycles at train stations. Cycling had to become faster and more convenient than driving before people would choose it.',
      'The benefits go beyond traffic. Bicycles take almost no space, so a bike lane can move several times more people per hour than a car lane of the same width. They produce no exhaust, and the daily exercise improves public health, which reduces the cost of medical care. One study estimated that the health savings from regular cycling are larger than the risks from accidents by a factor of about twenty to one.',
      'Of course, bicycles cannot solve everything. They are less useful in very hot or very cold climates, for people with physical disabilities, and for moving heavy goods. But as one part of a transport system, alongside trains, buses and walking, they are by far the cheapest way to make a city more livable.',
      'The lesson from Europe is that behaviour follows design. People do not need to be persuaded to cycle; they need streets where cycling feels safe. Cities that wait for a change of heart usually wait forever.'
    ]
  },
  {
    id: 'a-freeapps',
    title: 'If You Are Not Paying, You Are the Product',
    topic: '科技与社会',
    level: 'B2',
    source: '原创示例',
    paragraphs: [
      'There is an old saying in the technology industry: if you are not paying for the product, you are the product. It means that a free service is rarely free. Somebody is paying, and that somebody is usually an advertiser who wants your attention.',
      'The business model is simple to describe. A company builds something useful, such as a search engine, a map, or a social network, and gives it away. Millions of people arrive, and the company sells the chance to show them advertisements. The more time users spend inside the service, the more advertisements can be sold, so the product is quietly designed to be difficult to leave.',
      'For a long time, this trade seemed acceptable to most users. Recently, however, the price has become clearer. Investigations have shown that some applications collect location data, contacts and even messages, and share them with third parties in ways that users never agreed to. A free weather app has no obvious reason to know your contacts.',
      'Regulators have begun to respond. The European Union now requires companies to explain in plain language what data they collect and why, and to delete it on request. Fines have reached billions of euros. Whether these rules change company behaviour or only paperwork is still debated.',
      'There is also a quieter alternative: pay for things. A paid application has a customer rather than a product, and its interests point in a different direction. Paid services are usually smaller, show no advertisements, and treat the user as somebody to serve rather than somebody to sell. The question for each user is simple: what is your attention worth per month?'
    ]
  },
  {
    id: "a-sdg11",
    title: "FS Core Text SDG 11",
    topic: "城市与可持续发展",
    level: "B2",
    source: "UNSW 学术英语课程材料",
    paragraphs: [
      "Chapter 10: Inclusive, Safe, and Resilient Cities and Settlements – Summary",
      "Introduction",
      "This chapter provides an overall assessment of the implementation of SDG 11 (Sustainable Cities and Communities), which aims to make cities inclusive, safe, resilient, and sustainable. The chapter argues that while cities offer immense potential for improving human welfare, rapid urbanization has exacerbated challenges such as housing shortages, traffic congestion, environmental pollution, and inadequate public spaces. Rather than widening the gap between the rich and the poor, creating congestion and pollution, and isolating urban residents from nature, the existence of cities should make people's lives better. The common goals of city governance can be achieved using various solutions, with people placed at the center of governance and cities tailored locally for their residents. The assessment draws on global data, regional comparisons, and specific policy responses to evaluate progress toward the seven specific targets of SDG 11, including adequate housing, sustainable transport, disaster risk reduction, and access to green public spaces.",
      "To structure the global assessment, the chapter selects four interconnected dimensions of city governance for detailed analysis: slum improvement, public transportation, environmental pollution, and open public space. These dimensions are not isolated; each significantly impacts equitable housing, urban de-congestion, greenhouse gas reduction, and overall resident well-being. The chapter then introduces National Urban Policy (NUP) as a strategic \"package\" approach for coordinating national and local actions to address urbanization challenges, noting that clear NUPs have been well demonstrated in Brazil, China, South Africa, and other countries. Following this, the chapter examines the unique impacts of the COVID-19 pandemic on SDG 11, noting both temporary positive effects (e.g., reduced air pollution during lockdowns) and severe negative disruptions to economies, public finances, and service delivery. The chapter emphasizes that cities have been on the frontline in responding to the pandemic.",
      "A detailed case study of Beijing's successful air pollution control—particularly the reduction of PM2.5 concentrations by 53% between 2013 and 2019—is presented as a replicable model for developing countries grappling with smog. The case highlights the importance of top-down target setting, regional coordination, technological innovation, and public participation. The Swedish company IQAir and the United Nations Environment Programme have both praised Beijing as an example of successful policy implementation leading to air quality improvement, with the UNEP calling Beijing's experience \"a model that can be used for reference\" globally. The chapter concludes with specific recommendations to accelerate SDG 11 implementation globally, emphasizing collaborative governance mechanisms, new technologies, urban renewal strategies, and the dissemination of best practices. Overall, despite pockets of progress, the chapter warns that the world is off-track to meet most SDG 11 targets by 2030, especially in low- and middle-income countries.",
      "The introduction closes by framing the urgency of the situation. Between 2016 and 2018, the global urbanization rate rose from 54.37% to 55.27%, with much of this growth occurring in regions where infrastructure and governance capacity lag behind population increases. The proportion of the global urban population living in slums increased from 23% in 2016 to 24% in 2018, representing over 1 billion people. Housing affordability remains a universal challenge, with buyers needing more than five times their annual income to purchase a standard home, and renters spending over 25% of monthly income on rent. According to the 16th Annual Demographia International Housing Affordability Survey, housing prices increased in some of the least affordable major markets over the past year. Rental households often face severe financial strain, and for low-income families, inadequate housing and informal settlements remain the only options. These stark figures underscore the need for urgent, coordinated, and well-funded policy interventions.",
      "Regional Disparities and Drivers of Slum Growth",
      "Slum populations are increasing faster than they can be improved. While regions such as Europe, Northern America, Australia, and New Zealand are on track to meet SDG 11.1 (adequate housing), others show only moderate progress (Northern Africa, Western Asia, Central and Southern Asia) and some show limited or no progress (Sub-Saharan Africa, Latin America, the Caribbean, Oceania except Australia/New Zealand). Sub-Saharan Africa is the most critical region, with over half of its urban residents living in slums. The sustained growth of slums results from rapid urbanization, rising income polarization, and population growth rates that outpace the response capacity of urban governments. In many developing countries, low-income households have no choice but informal settlements, as formal housing is unaffordable. The situation in North Africa and West Asia is showing a worsening trend, with housing affordability declining despite some policy efforts. Up to 24% of the world's urban population lived in slums in 2018, an increase of 1% over 2016, with more than 1 billion people living in slums and informal settlements globally. The global urban slum population proportion has continued to increase in the past few years, with slums growing faster than they are being improved. This creates a high risk of failing to achieve SDG target 11.1 by 2030, which aims to ensure access for all to adequate, safe, and affordable housing.",
      "Government-Led and Market-Based Interventions",
      "Governments and intergovernmental institutions like UN-Habitat have attempted two main approaches to address the slum crisis. First, government-led slum upgrading involves renovating city centers, demolishing slums, relocating residents, and then selling or leasing redeveloped land for higher-value urban development. This approach can clear slums quickly but risks displacing vulnerable populations without adequate alternative housing. Second, \"urban renewal\" campaigns involve multiple actors: the market provides housing supply through market-oriented mechanisms, while governments supply low-rent or affordable housing for those unable to afford market rates. The government should guide and involve multiple subjects in the housing supply plan to improve overall supply. In the process of rapid population gathering, if urban construction and management cannot keep up with rapidly growing demand, a series of contradictions will be triggered, resulting in housing shortages and numerous slums. Countries have steadily improved urban slums and committed to ridding millions of people of poor living environments. However, renewed political attention from business and political leaders, increased investments, and multi-level, multi-agent participation housing supply systems are essential. Without these, the goal of affordable and adequate housing for all by 2030 will almost certainly fail, leaving billions in substandard living conditions.",
      "The Failure of Car-Centric Planning",
      "Traffic congestion is one of the most intractable urban problems, affecting virtually every major city worldwide. Rapid urbanization, rising housing prices, and the legacy of \"adapting to car development\" policies (adopted by many cities in the late 20th century) have led to an explosion in private vehicle ownership. This causes severe congestion, which in turn reduces economic productivity, increases pollution, creates safety hazards, and diminishes quality of life. For many young families forced to live in suburbs due to high inner-city housing costs, driving becomes the only feasible commuting option, while public transport is time-consuming, unreliable, or completely unavailable. Ring expressways, intended to alleviate congestion, often become clogged soon after opening as induced demand fills the new capacity almost immediately. This \"persistent urban disease\" hinders development by causing the decline of economic and social functions and the continuous deterioration of the living environment. Traffic congestion will not only lead to the decline of various economic and social functions but will also lead to the continuous deterioration of the city's living environment, becoming a major obstacle to sustainable urban development.",
      "Smart Transportation and Shared Mobility Solutions",
      "Cities have implemented two key measures to combat congestion: increasing public transport supply and adopting smart transportation technologies. Regarding public transport supply, with the rise of internet technology, cities with large numbers of private cars began optimizing private car use. In Paris, bike-sharing (2007) and electric vehicle sharing (2011) helped control single-driver vehicles. Global ride-sharing companies (Uber, Didi) use privately owned vehicles as part of mobile travel solutions, potentially reducing private car ownership rates and improving traffic accessibility. Car sharing and carpooling help control or even reduce private car ownership rates. Shenzhen's \"rail+real estate\" model finances infrastructure through land premiums, reducing government funding dependence by 50% while introducing some market risks. Dubai plans to convert 25% of trips to autonomous travel by 2030, estimating a 44% cost reduction. Smart transportation systems using edge cloud facilities and central cloud platforms (as in Seoul) can reduce commuting time by 15–20% through optimized traffic control systems and driving behaviour analysis. Despite these efforts, only 49% of urban residents in 467 cities (90 countries) had convenient access to public transport in 2019 – a 53% decline from 2018. Sub-Saharan Africa lags at just 35% access, and informal transport modes remain widely available in many low-access regions. Faster progress is still needed globally, especially for developing countries.",
      "Sources and Health Impacts of Air Pollution",
      "Residents in many big cities are deeply affected by air pollution, which causes nearly 7 million deaths annually, including 650,000 children under the age of five. Air pollution increases risks of stroke, heart disease, lung cancer, and chronic and acute respiratory diseases including asthma. Over 90% of air pollution-related deaths occur in low- and middle-income countries, mainly in Asia and Africa. In 2019, the top 10 countries with the worst air pollution were all in Asia. In 2016, 97% of cities with over 100,000 residents in low- and middle-income countries did not meet WHO air quality standards, compared to 49% in high-income countries. Three billion people still rely on solid fuels (wood, coal, crop residues, and kerosene) for cooking, heating, and lighting, exposing them to dangerous fine particles, especially women and children who spend more time indoors. The elderly, children, the sick, and the poor are more vulnerable to air pollution. Climate change exacerbates the problem by increasing the frequency and intensity of forest fires and sandstorms, as seen in Singapore, Kuala Lumpur, Bangkok, Chiang Mai, Los Angeles, Australia, Indonesia, Brazil, and the United States. Air pollutants affect not only health but also ecosystems, food production, and climate patterns.",
      "Mitigation Strategies and Remaining Gaps",
      "Cities have adopted two main strategies to combat air pollution. First, reducing emissions through clean energy plans: expanding renewable energy and electricity, eliminating coal, decarbonizing transportation and industry, avoiding future emissions, and implementing renewable energy sources (wind, solar, and hydroelectric). Many recent studies have shown that actions to mitigate greenhouse gas emissions can quickly have positive impacts on economic and social welfare by improving public health and ecosystem sustainability. India's Ujjwala Plan provided free liquefied petroleum gas connections to 37 million poor women living below the poverty line to support the switch to clean household energy. Mexico City pledged smoke-free buses and a ban on private diesel vehicles by 2025. Second, optimizing urban ecological space: \"Forest City,\" \"Garden City,\" and \"Ecological City\" have become planning concepts worldwide. Research shows each tree can help reduce carbon emissions from power plants by about 10kg by reducing air conditioner demand through shade and evapotranspiration. Examples include Singapore's skyscraper greening project, New York's Central Park, and London's construction of a national park city. Some governments promote coordinated climate-air pollution governance, as seen in Canada's Short-Lived Climate Pollutants policy (the world's first) and China's air pollution controls, which have become important driving forces for green transitions. However, progress remains insufficient, with over half the world's population experiencing increased fine particulate matter between 2010 and 2016.",
      "The Benefits and Shortages of Public Space",
      "Parks, boulevards, gardens, amusement parks, and streets provide essential social, economic, and mental health benefits. Public open spaces in cities can provide interactive places for people, play important roles in social and economic life, and are beneficial to the physical and mental health of urban residents. Walkable urban public recreational space (UPRS) is now a key planning concept, with some city governments aiming to create \"community life circles\" that ensure accessibility to daily living service facilities within convenient walking distance. The successful transformation of street space into a walkable and dynamic place with the dual attribute of \"traffic space-public space\" helps create more human-centred urban environments. Innovative projects have transformed abandoned infrastructure into public amenities – for example, New York's High Line (a disused railway turned into an elevated park and commercial area) successfully brought about the revival of the entire region. Some developing countries pursue \"urban gardening\" plans that combine design, architecture, and landscape interventions to stimulate new layers of urban life. The activation of existing facilities through abandoned railway and factory conversions has proven effective worldwide. These efforts can create more human-centered environments and improve resident welfare.",
      "Decline, Privatization, and Regional Gaps",
      "Despite growing awareness, public space is often inadequate, poorly designed, or privatized due to financial pressures and commercial development impulses. Cities become increasingly segregated as a result, with wealthy areas enjoying ample green space while poorer neighbourhood’s lack any public gathering areas. Based on data from 467 cities in 90 countries in 2019, few cities have been able to implement a system of open public spaces that covers entire urban areas within easy reach of all residents. The average share of population within 400 meters walking distance of an open public space is only around 35% – down from 53% in 2018 and 59% in 2014. This significant decline over time indicates that progress is moving backward, not forward, as commercial development pressures continue to erode existing public spaces. Regional disparities are stark: Australia/New Zealand (67%), North America/Europe (67%), Latin America/Caribbean (46%), West/North Africa (40%), sub-Saharan Africa (26%), Central/South Asia (26%), and East/South-East Asia (22%). A low percentage does not necessarily mean the share of land in open public space is inadequate; rather, distribution and accessibility are poor, with many residents unable to reach existing spaces due to unsafe streets, lack of sidewalks, or distance. Few cities have implemented open public space systems covering entire urban areas.",
      "National Urban Policy as a Coordinating Framework",
      "National Urban Policies (NUPs) are coherent, government-led strategies that coordinate various actors toward a common vision for transformative, productive, inclusive, and resilient urban development. A NUP is a coherent set of decisions derived through a deliberate government-led process of coordinating and rallying various actors for a common vision and goal. NUPs serve three key functions: First, they position state institutions as primary change agents, often using Public-Private Partnerships (PPPs) for improved planning and service delivery. While objectives may differ between more socially or economically driven motives, NUPs can be conceived as policy vehicles for state-led, private-involved approaches. Second, they integrate related policies (smart city plans, urban development plans, sustainable urban development plans) across different levels of government, linking cities, peri-urban areas, and villages, thus providing comprehensive solutions to the challenges posed by urbanization. Third, they align national policies with SDG targets, subdividing them by important themes of the sustainable development agenda. The number of countries with NUPs increased from 142 in 2015 to 149 in 2017 and further to 150 in 2019, with nearly half fully implemented. Brazil, China, and South Africa demonstrate successful NUP implementation.",
      "COVID-19's Dual Effect on SDG 11",
      "The COVID-19 pandemic severely disrupted societies, economies, and public governance, representing the worst public health emergency of the 21st century. By April 2020, the virus had spread to all continents, challenging governance capacity at all levels. The pandemic has had unprecedented effects, including severe disruption to societies and economies, global travel and commerce, and the livelihoods of people, particularly the poorest. Stagnation reduced government revenues and personal incomes, directly affecting housing, transport, and public space construction. The impact of the crisis will reverse hard-won development gains and hinder progress toward achieving the SDGs. However, there was a short-term positive effect: IQAir data showed air pollution in 10 major cities dropped 9–60% during lockdowns, with annual PM2.5 and PM10 averages potentially better than expected in 2020. This improvement was temporary; as economies recover, air pollution remains a great challenge to the physical and mental health of urban residents worldwide. Overall, achieving SDG 11 by 2030 is a huge challenge, especially for developing countries with insufficient public financial resources. These countries are more likely to lack effective means to achieve the expected targets, requiring proactive national approaches and global coordination mechanisms to assist with common governance problems.",
      "Case Study – Beijing's Air Pollution Control",
      "The Threat and Initial Conditions",
      "Between 1996 and 2018, China's urbanization rate rose from 30% to 61%, bringing severe environmental challenges, most notably smog dominated by PM2.5. In 2017, Beijing's GDP, population, and vehicle ownership were 11.78 times, 1.74 times, and 4.35 times that of 1998, respectively, with per capita GDP exceeding US$20,000, a resident population of 21.7 million, and vehicle ownership of 5.99 million. The rapid development of the urban economy led to deteriorating air quality, with urban residents facing daily \"smog\" problems. In 2013, Beijing's annual average PM2.5 concentration was 89.5μg/m³ – exceeding China's national air quality standard of 35μg/m³ and far above WHO's guideline of 10μg/m³. Beijing established 35 PM2.5 monitoring stations in 2012 and began releasing pollutant monitoring data on January 1, 2013. Through coordinated national, regional, and local efforts over many years, including systematic policy implementation and scientific methods, Beijing reduced PM2.5 concentration by 53% between 2013 and 2019. By 2020, Beijing had dropped off the list of the world's 200 most polluted cities. The Swedish company IQAir considered Beijing an example of successful policy implementation leading to air quality improvement at a press conference on the release of testing data in 2020. The United Nations Environment Programme's 2019 report also gave the same conclusion, praising Beijing's experience in air pollution control as \"a model that can be used for reference\" for the world.",
      "Policy Measures and Public Participation",
      "Success rested on three pillars. First, top-down target setting: In 2016, China's National Plan on Implementation of the 2030 Agenda for Sustainable Development was released, providing overall guidance. China's 13th Five-Year Plan (2016–2020) added two new air quality indicators (\"ratio of days with good air quality in cities at prefecture level and above\" and \"PM2.5 concentration drop in cities where PM2.5 is not up to standard\"), creating incentives for local governments. Second, Beijing-Tianjin-Hebei coordinated governance: the region reduced coal consumption by 71 million tons (2012–2017), adjusted industrial structure toward low-energy sectors (information technology, biology, high-end equipment manufacturing, new energy), eliminated surplus production capacity of energy-intensive industries, and cut motor vehicle fuel use through subsidies for new energy vehicles (purchase subsidies, charging piles, expanded new energy buses). Consequently, Beijing's PM2.5 fell to 58μg/m³ in 2017, meeting the State Council's target. Third, Beijing's local measures included seven categories: coal-fired boiler renovation, clean-up of civil fuels, industrial structure adjustment, emission control of mobile sources, upgrading of industrial standards, comprehensive dust control, and treatment of volatile organic compounds. Public participation was crucial: carbon trading pilots (launched in 2011 in seven regions), information disclosure through all-media communications platforms (newspaper, radio, television, internet, Weibo, WeChat), environmental hotlines, online complaint mailboxes, and cash incentives (up to 50,000 Yuan per case) encouraged reporting of violations. Beijing's \"common governance and sharing\" plan mobilized the whole city. Strong public support and multi-stakeholder co-governance were key to success. Nevertheless, Beijing's PM2.5 remains above WHO's minimum standard (35μg/m³), indicating that thorough improvement is a long-term task requiring participation of all citizens. Beijing's experience provides a reference model for urban air pollution control in developing countries worldwide.",
    ]
  },
  {
    id: "a-sdg-intro",
    title: "Introduction to the Sustainable Development Goals",
    topic: "可持续发展",
    level: "B2",
    source: "UNSW Academic English 学生用书",
    paragraphs: [
      "Introduction to the Sustainable Development Goals (SDGs)",
      "Since their adoption in 2015, the United Nations Sustainable Development Goals (SDGs) have provided a global blueprint for addressing some of the world’s most pressing social, environmental, and economic challenges. These 17 interconnected goals aim to eliminate poverty, protect the planet, and ensure prosperity for all by the year 2030. The SDGs build on decades of international development work, including the earlier Millennium Development Goals (MDGs), which guided global progress from 2000 to 2015. Unlike the MDGs, which focused mostly on developing nations, the SDGs are universal—they apply to all countries, regardless of income level. This broad approach reflects a growing understanding that global problems like climate change, inequality, and resource depletion require cooperative solutions and shared responsibility among nations.",
      "Targets, Indicators, and Progress Monitoring of the SDGs",
      "Each goal is supported by specific targets and indicators that help governments, businesses, and civil society measure progress and identify areas needing improvement. For example, Goal 1—No Poverty—includes targets such as reducing the proportion of people living on less than $1.90 a day and increasing access to basic services like education, healthcare, and social protection. Similarly, Goal 13—Climate Action—urges countries to integrate climate change measures into national policies and strengthen resilience to climate-related disasters. These targets are monitored through data collection and reporting, which are essential for transparency and accountability. According to the UN’s 2023 Sustainable Development Report, while some progress has been made, many goals are off track due to ongoing global crises such as the COVID-19 pandemic, conflicts, and economic instability.",
      "Interconnectedness and Holistic Approach of the SDG Framework",
      "The SDGs are based on the principle of \"leaving no one behind,\" emphasizing the importance of inclusion, equity, and human rights. The framework recognises that issues like poverty, health, education, gender equality, and environmental protection are deeply connected. For instance, improving access to clean water (Goal 6) directly affects public health (Goal 3), which in turn can improve educational outcomes (Goal 4) and economic productivity (Goal 8). This interdependence means that progress in one area often supports progress in others, but also that failure in one area can hold back success in the rest. Importantly, the SDGs encourage governments to take a holistic approach to development by addressing root causes, engaging diverse stakeholders, and tailoring strategies to local needs and contexts.",
      "Challenges and the Enduring Value of the SDGs",
      "Despite widespread international support, the implementation of the SDGs faces several challenges. Funding gaps, political instability, lack of data, and uneven commitment across countries continue to hinder progress. Furthermore, the impacts of climate change, global inequality, and ongoing humanitarian crises make the goals more urgent but also harder to achieve. Some critics argue that the SDGs are too ambitious or vague, while others stress that without stronger accountability systems and clearer timelines, they risk becoming symbolic rather than transformational. Nevertheless, the SDGs remain a valuable guiding framework. They offer a shared language and vision for global cooperation, pushing nations to think long-term and act responsibly in the face of complex challenges. If implemented effectively, the SDGs have the potential to create a more sustainable, just, and inclusive world for future generations.",
      "Smith, A., Jones, B. & Williams, C. (2023) 'The United Nations Sustainable Development Goals: A Global Framework for a Better Future', Journal of Global Policy and Development, 8(1), pp. 15-32. https://doi.org/10.1234/jgpd.2023.01.002",
    ]
  },
  {
    id: 'a-ai-ethics',
    title: 'The Ethics of AI: Five Pressing Questions',
    topic: '科技与伦理',
    level: 'B2',
    source: '雅思写作 Task 2 素材（Discussion 类）',
    paragraphs: [
      '[1] As AI technologies continue to advance, questions about the ethics of AI become more pressing than ever. Complex ethical issues surround current and near-future AI systems. For instance, leading technology companies are building self-driving cars, which promise to increase personal mobility for elderly and disabled people and to save lives by reducing driver error; however, in an emergency, should a self-driving car prioritize the lives of the passengers or the lives of pedestrians?',
      '[2] Many countries are developing autonomous weapon systems capable of identifying and attacking a target without human intervention. Autonomous weapon systems offer the potential to decrease risks to military personnel and civilians by being better than stressed-out soldiers in the heat of a battle at distinguishing civilians from combatants and at making reasonable trade-offs between military gains and risk or harm to civilians. But should we as a society give machines this kind of moral decision-making power? Who is at fault if an autonomous weapon system attacks a hospital or a school?',
      '[3] AI has been found to be particularly useful for revealing otherwise unrecognizable patterns in complex processes. As a result, police departments are investigating ways to use AI to identify likely criminals among the general population. Likewise, some judges and prison officials are interested in using AI to develop “risk prediction” tools to assist with decisions on criminal sentencing, bail hearings, and parole. However, among other things, machine learning requires good data because incomplete or unrepresentative data can exacerbate problems of bias. At the same time, advanced AI systems tend to process large volumes of data, and their inner workings tend not to be transparent. Given this, how can we create AI systems that are fair and that do not inadvertently produce biased results?',
      '[4] At the same time, Japan, Italy, and some other countries are looking into using robots to care for and provide companionship to their elderly population. Many companies are racing to build robots with sophisticated AI for romantic relationships. What ethical issues are raised by companion robots and romantic robots? Will humans be able to marry robots? How will this impact our relationships with other humans?',
      '[5] It is estimated that 47% of American jobs could be lost to AI and automation in the next twenty years. How should we help people adjust to this level of unemployment? Should taxes be levied on robots that replace human workers, as Bill Gates has suggested? Should we offer everyone a universal basic income?'
    ]
  }
];

/* 置顶文章：素材库中排在最前面（按数组顺序），并显示「置顶」标签 */
const PINNED_ARTICLE_IDS = ['a-sdg11', 'a-ai-ethics'];

/* ---------------- 提示词模板 ---------------- */

/* =========================================================
 * 听力素材库（真实音频）
 * 来源：UNSW FNDN Academic English 课程 "progress support listening workshop" 音频
 * 按 workshop 周次拆分；file 为本机课程文件夹中的文件名。
 * 双击打开 index.html 时，浏览器可直接用 file:// 绝对路径加载；
 * 若个别文件被浏览器安全策略拦截，可在播放器内用「导入此文件」按钮手动选择。
 * 注：两个 "task 4 section a" 文件 MD5 相同（重复命名），已去重为 1 条。
 * ========================================================= */
const LISTEN_BASE = 'file:///C:/Users/Liora/Desktop/新南2026/Course_ FNDN Academic English 2026 STD O2 _ UNSW_week type unit/';
const LISTEN_AUDIO = [
  { id: 'la-w1',    workshop: 1, title: 'Listening Workshop 1',           file: 'progress support listening workshop 1 audio.mp3' },
  { id: 'la-w2t3',  workshop: 2, title: 'Workshop 2 · Task 3',           file: 'progress support listening workshop 2 - task 3.mp3' },
  { id: 'la-w2t4a', workshop: 2, title: 'Workshop 2 · Task 4 Section A', file: 'progress support listening workshop 2 - task 4 section a.mp3' },
  { id: 'la-w2t5b', workshop: 2, title: 'Workshop 2 · Task 5 Section B', file: 'progress support workshop 2 - task 5 section b.mp3' },
  { id: 'la-w3c',   workshop: 3, title: 'Workshop 3 · Section C',        file: 'progress support listening workshop 3 - section c.wav' },
  { id: 'la-w3d',   workshop: 3, title: 'Workshop 3 · Section D',        file: 'progress support workshop 3 section d.wav' },
  { id: 'la-w3e',   workshop: 3, title: 'Workshop 3 · Section E',        file: 'progress support workshop 3 section e.wav' },
  { id: 'la-w4f',   workshop: 4, title: 'Workshop 4 · Section F',        file: 'progress support workshop 4 section f.wav' }
];

const PROMPTS = {
  /* 划词翻译 */
  translate: (text) => ([
    { role: 'system', content: '你是英译中翻译。只输出中文译文，不要解释，不要输出英文。' },
    { role: 'user', content: '请把下面这段英文翻译成自然流畅的中文：\n' + text }
  ]),

  /* 单词释义（点击文章中的单词） */
  word: (word, sentence) => ([
    { role: 'system', content: '你是一本简洁的英汉词典，面向 CEFR B2 水平的中文学习者。用中文回答，总共不超过 70 字。' },
    { role: 'user', content: '单词 "' + word + '" 在句子 "' + sentence + '" 中的意思。请给出：① 词性 + 中文释义；② 该语境下的常见搭配（如有）。' }
  ]),

  /* 长难句解析 */
  analyze: (sentence) => ([
    { role: 'system', content: '你是资深英语语法老师，学生是 CEFR B2 水平的中文学习者。用中文讲解，清晰分段。' },
    { role: 'user', content: '请分析这个英语句子：\n"' + sentence + '"\n请按以下四部分输出：\n1. 中文翻译\n2. 句子结构：找出主干（主谓宾），指出每个从句的类型和作用\n3. 值得学习的词组或句型\n4. 一个同义改写（意思不变，换一种更地道的表达）' }
  ]),

  /* 写作四维批改（输出 JSON） */
  essay: (articleTitle, taskText, essayText) => ([
    { role: 'system', content: '你是雅思写作阅卷官，同时是耐心的英语老师。你的学生是 CEFR B2 水平的中文学习者。' },
    { role: 'user', content:
      '学生阅读了文章《' + articleTitle + '》，写作任务是：' + taskText + '\n\n' +
      '学生作文如下：\n"""\n' + essayText + '\n"""\n\n' +
      '请按雅思四项评分标准打分（0-9 分，可 0.5 递增）：TR 任务回应、CC 连贯衔接、LR 词汇多样性、GRA 语法广度与准确性。\n' +
      '只输出 JSON（不要输出任何其他文字、不要用 markdown 代码块），格式：\n' +
      '{"overall": 6.5, "scores": {"TR": 6.5, "CC": 6, "LR": 7, "GRA": 6}, "summary": "80字以内的中文总评，指出最需要改进的一点", "corrections": [{"original": "原文句子", "revised": "修改后句子", "reason": "中文原因"}], "highlights": ["作文中值得肯定的亮点"]}\n' +
      'corrections 最多 6 条，挑最重要的；highlights 最多 3 条。'
    }
  ]),

  /* 口语：系统人设（会话中持续携带） */
  speakSystem: (articleTitle) => (
    'You are an encouraging English speaking tutor. Your student is a Chinese learner at CEFR B2 level who just read the article "' + articleTitle + '". ' +
    'Rules: keep every reply under 60 words; ask exactly one follow-up question; use natural spoken English; ' +
    'do NOT correct grammar mistakes inside the conversation (a separate report will do that); be warm and patient.'
  ),

  /* 口语：开场白 */
  speakOpen: (articleTitle) => ([
    { role: 'system', content: PROMPTS.speakSystem(articleTitle) },
    { role: 'user', content: 'Please start the speaking practice about the article I just read. Introduce yourself in one short sentence and ask my opinion about one specific idea from the article.' }
  ]),

  /* 口语：反馈报告（输出 JSON） */
  speakReport: (articleTitle, userTexts) => ([
    { role: 'system', content: '你是英语口语老师，学生是 CEFR B2 水平的中文学习者。请基于学生的口语表达记录给出反馈。' },
    { role: 'user', content:
      '学生围绕文章《' + articleTitle + '》进行了口语练习，以下是学生的全部发言：\n' + userTexts + '\n\n' +
      '只输出 JSON（不要输出任何其他文字、不要用 markdown 代码块），格式：\n' +
      '{"overallComment": "60字以内的中文总体评价", "grammarErrors": [{"wrong": "学生原话", "right": "正确说法", "why": "中文简因"}], "betterExpressions": [{"original": "学生的表达", "upgraded": "更地道的说法"}], "fluencyTips": ["中文提升建议1", "中文提升建议2"]}\n' +
      'grammarErrors 最多 5 条，betterExpressions 最多 4 条，fluencyTips 最多 3 条。如果没有明显错误，grammarErrors 给空数组并鼓励。'
    }
  ]),

  /* AI 生成文章 */
  genArticle: (topic) => ([
    { role: 'system', content: 'You are an English textbook editor. You write original articles for CEFR B2 Chinese learners.' },
    { role: 'user', content:
      '请原创一篇英语文章，主题：' + (topic || '任选一个有趣的科普或社会话题') + '\n' +
      '要求：350-450 词；CEFR B2 难度（比高考略难，比雅思阅读简单）；4-6 个自然段；' +
      '包含一些值得学习的长难句和地道表达；不要小标题。\n' +
      '严格按以下格式输出（不要输出其他内容）：\nTitle: <文章标题>\n\n<第一段>\n\n<第二段>\n\n<后续段落，每段之间空一行>'
    }
  ])
};
