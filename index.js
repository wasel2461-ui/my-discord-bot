const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// --- إعداد سيرفر الويب (Express) لإبقاء البوت حياً 24 ساعة ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('⚙️ البوت الملوكي يعمل بكفاءة وسيرفر الويب نشط 24/7!');
});

app.listen(PORT, () => {
    console.log(`🌐 سيرفر الويب جاهز ومستمع على المنفذ: ${PORT}`);
});

// --- إعداد بوت ديسكورد ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,   // وضعنا فاصلة هنا
        GatewayIntentBits.GuildModeration // أضفنا هذا السطر الجديد للحماية
    ]
});

// قاعدة بيانات وهمية في الذاكرة
const db = {
    points: {},        // نقاط المستخدمين
    shield_kill: {},   // درع حماية الروليت
    roulette_x2: {},   // مضاعف دبل
    roulette_x3: {}    // مضاعف تريبل
};

// بيانات الألعاب والفعاليات الـ 33
const GAMES_DATA = {
    game_capitals: { title: 'عواصم الدول', emoji: '🌍' },
    game_flags: { title: 'أعلام الدول', emoji: '🏳️‍🌈' },
    game_puzzle: { title: 'ألعاب و ألغاز', emoji: '🧩' },
    game_math_fast: { title: 'السرعة الحسابية', emoji: '⚡' },
    game_history: { title: 'أسئلة تاريخية', emoji: '📜' },
    game_sc_nature: { title: 'علوم وطبيعة', emoji: '🧬' },
    game_brands: { title: 'براندات وشعارات', emoji: '🏷️' },
    game_general: { title: 'ثقافة عامة', emoji: '🧠' },
    game_unscramble: { title: 'تفكيك الكلمات', emoji: '🔤' },
    game_fast_click: { title: 'السرعة والضغط', emoji: '⏱️' },
    game_complete: { title: 'أكمل الجملة', emoji: '✍️' },
    game_riddle: { title: 'حجرات وفوازير', emoji: '🔍' },
    game_true_false: { title: 'صح أم خطأ', emoji: '✅' },
    game_iq_test: { title: 'اختبار ذكاء سريع', emoji: '💡' },
    game_currency: { title: 'عملات الدول', emoji: '🪙' },
    game_proverbs: { title: 'أمثال شعبية', emoji: '🗣️' },
    game_anime: { title: 'عالم الأنمي', emoji: '🥷' },
    game_sports: { title: 'رياضة وكورة', emoji: '⚽' },
    game_would_you: { title: 'لو خيروك بالأزرار', emoji: '⚖️' },
    game_math: { title: 'مسابقة رياضيات', emoji: '🧮' },
    game_long_math: { title: 'احسب المعادلة الطويلة', emoji: '🧮' },
    game_tr_en: { title: 'ترجمة إلى الإنجليزية', emoji: '🇬🇧' },
    game_tr_ar: { title: 'ترجمة إلى العربية', emoji: '🇸🇦' },
    game_antonym: { title: 'ما هو ضد الكلمة', emoji: '📝' },
    game_roulette: { title: 'روليت عجلة الموت الجماعية المطور', emoji: '🎡' },
    game_chairs: { title: 'كراسي الاختباء الجماعية الكبرى', emoji: '🪑' },
    game_dice: { title: 'رمي النرد المطور', emoji: '🎲' },
    game_guess_num: { title: 'تخمين الرقم السري', emoji: '🔢' },
    game_xo: { title: 'تحدي XO ثنائي', emoji: '⚔️' },
    game_rps: { title: 'حجرة ورقة مقص التفاعلية', emoji: '⚔️' },
    game_wheel: { title: 'عجلة حظك اليوم', emoji: '🔮' },
    game_bomb: { title: 'تفكيك القنبلة الموقوتة', emoji: '💣' },
    game_penalty: { title: 'تسديد ضربات جزاء (بلنتي)', emoji: '⚽' }
};

// دالة مساعدة لزيادة النقاط
function addPoints(userId, amount) {
    if (!db.points[userId]) db.points[userId] = 0;
    db.points[userId] += amount;
}

// دالة إعادة إظهار قائمة الألعاب تلقائياً بعد انتهاء الجولات
async function loopGamesMenu(channel) {
    setTimeout(async () => {
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🎮 منصة الفعاليات والألعاب الملوكية المستمرة')
            .setDescription('اختر اللعبة التالية من القائمة بالأسفل لبدء جولة جديدة فوراً وتجميع النقاط لمتجرك الخاص!');
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_game_main')
            .setPlaceholder('🎯 اختر اللعبة أو الفعالية التي تبيها الحين...')
            .addOptions(
                Object.entries(GAMES_DATA).slice(0, 25).map(([key, value]) => ({
                    label: value.title,
                    value: key,
                    emoji: value.emoji
                }))
            );

        const selectMenu2 = new StringSelectMenuBuilder()
            .setCustomId('select_game_second')
            .setPlaceholder('✨ المزيد من الألعاب والفعاليات من هنا...')
            .addOptions(
                Object.entries(GAMES_DATA).slice(25).map(([key, value]) => ({
                    label: value.title,
                    value: key,
                    emoji: value.emoji
                }))
            );

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(selectMenu2);
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_shop_btn').setLabel('🛒 متجر استبدال النقاط الملوكي').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('stop_game').setLabel('🛑 إغلاق الفعاليات نهائياً').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ embeds: [embed], components: [row1, row2, row3] }).catch(() => {});
    }, 4000); 
}

// تشغيل البوت وتسجيل أوامر السلاش تلقائياً
client.once('ready', async () => {
    console.log(`✅ تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
    try {
        await client.application.commands.set([
            { name: 'العاب', description: 'فتح منصة الألعاب والفعاليات الملوكية المفتوحة لجمع النقاط' },
            { name: 'شراء', description: 'فتح متجر استبدال النقاط الملوكي مباشرة' }
        ]);
        console.log('🚀 تم تسجيل أوامر السلاش (/العاب و /شراء) بنجاح في ديسكورد!');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء تسجيل أوامر السلاش:', error);
    }
});

client.on('interactionCreate', async interaction => {
    const channel = interaction.channel;
    const userId = interaction.user.id;

    // 1. أمر /العاب
    if (interaction.isChatInputCommand() && interaction.commandName === 'العاب') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ عذراً! هذا الأمر مخصص فقط لإدارة السيرفر لتشغيل نظام الفعاليات.', ephemeral: true });
        }

        const mainEmbed = new EmbedBuilder()
            .setColor('#1ABC9C')
            .setTitle('🎮 منصة الفعاليات والألعاب الملوكية المفتوحة')
            .setDescription('أهلاً بكم في نظام الفعاليات المتكامل! اختر اللعبة المفضلة لديك من القوائم المنسدلة بالأسفل لبدء التحدي وجمع النقاط للشراء من المتجر.');

        const menu1 = new StringSelectMenuBuilder()
            .setCustomId('select_game_main')
            .setPlaceholder('🎯 اختر اللعبة أو الفعالية التي تبيها الحين...')
            .addOptions(Object.entries(GAMES_DATA).slice(0, 25).map(([key, value]) => ({ label: value.title, value: key, emoji: value.emoji })));

        const menu2 = new StringSelectMenuBuilder()
            .setCustomId('select_game_second')
            .setPlaceholder('✨ المزيد من الألعاب والفعاليات من هنا...')
            .addOptions(Object.entries(GAMES_DATA).slice(25).map(([key, value]) => ({ label: value.title, value: key, emoji: value.emoji })));

        const row1 = new ActionRowBuilder().addComponents(menu1);
        const row2 = new ActionRowBuilder().addComponents(menu2);
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_shop_btn').setLabel('🛒 متجر استبدال النقاط الملوكي').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('stop_game').setLabel('🛑 إغلاق الفعاليات نهائياً').setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [mainEmbed], components: [row1, row2, row3] });
    }

    // 2. أمر /شراء المباشر
    if (interaction.isChatInputCommand() && interaction.commandName === 'شراء') {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        const pts = db.points[userId] || 0;

        const shopEmbed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🛒 متجر الفعاليات الملوكي لاستبدال النقاط')
            .setDescription(`رصيدك الحالي الحين: **${pts}** نقطة 🪙\n\nاختر السلعة التي ترغب في شرائها فوراً من القائمة أدناه:`);

        const shopMenu = new StringSelectMenuBuilder()
            .setCustomId('buy_shop_item')
            .setPlaceholder('🛒 حدد السلعة لتأكيد الشراء الفوري الحين...')
            .addOptions([
                { label: 'شراء درع حماية الروليت', value: 'buy_shield', description: 'السعر: 250 نقطة', emoji: '🛡️' },
                { label: 'شراء بطاقة دبل كاش X2', value: 'buy_x2', description: 'السعر: 400 نقطة', emoji: '⚡' },
                { label: 'شراء بطاقة تريبل كاش X3', value: 'buy_x3', description: 'السعر: 600 نقطة', emoji: '👑' }
            ]);

        return interaction.editReply({ embeds: [shopEmbed], components: [new ActionRowBuilder().addComponents(shopMenu)] }).catch(() => {});
    }

    // فتح المتجر الإلكتروني عن طريق الزر
    if (interaction.isButton() && interaction.customId === 'open_shop_btn') {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        const pts = db.points[userId] || 0;

        const shopEmbed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🛒 متجر الفعاليات الملوكي لاستبدال النقاط')
            .setDescription(`رصيدك الحالي الحين: **${pts}** نقطة 🪙`);

        const shopMenu = new StringSelectMenuBuilder()
            .setCustomId('buy_shop_item')
            .setPlaceholder('🛒 حدد السلعة لتأكيد الشراء الفوري الحين...')
            .addOptions([
                { label: 'شراء درع حماية الروليت', value: 'buy_shield', description: 'السعر: 250 نقطة', emoji: '🛡️' },
                { label: 'شراء بطاقة دبل كاش X2', value: 'buy_x2', description: 'السعر: 400 نقطة', emoji: '⚡' },
                { label: 'شراء بطاقة تريبل كاش X3', value: 'buy_x3', description: 'السعر: 600 نقطة', emoji: '👑' }
            ]);

        return interaction.editReply({ embeds: [shopEmbed], components: [new ActionRowBuilder().addComponents(shopMenu)] }).catch(() => {});
    }

    // معالجة الشراء من المتجر
    if (interaction.isStringSelectMenu() && interaction.customId === 'buy_shop_item') {
        await interaction.deferUpdate().catch(() => {});
        const item = interaction.values[0];
        const userPoints = db.points[userId] || 0;

        let cost = 0; let itemKey = ''; let itemName = '';
        if (item === 'buy_shield') { cost = 250; itemKey = 'shield_kill'; itemName = 'درع حماية الروليت 🛡️'; }
        else if (item === 'buy_x2') { cost = 400; itemKey = 'roulette_x2'; itemName = 'بطاقة دبل كاش X2 ⚡'; }
        else if (item === 'buy_x3') { cost = 600; itemKey = 'roulette_x3'; itemName = 'بطاقة تريبل كاش X3 👑'; }

        if (userPoints < cost) {
            return interaction.followUp({ content: `❌ عذراً! نقاطك غير كافية لإتمام هذه العملية. تحتاج إلى **${cost}** نقطة.`, ephemeral: true }).catch(() => {});
        }

        db.points[userId] -= cost;
        if (!db[itemKey][userId]) db[itemKey][userId] = 0;
        db[itemKey][userId]++;

        return interaction.followUp({ content: `🎉 مبروك! تم شراء **${itemName}** بنجاح!`, ephemeral: true }).catch(() => {});
    }

    // زر إيقاف الفعاليات
    if (interaction.isButton() && interaction.customId === 'stop_game') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ عذراً! فقط الإدارة يمكنها إغلاق لوحة الفعاليات بالكامل.', ephemeral: true }).catch(() => {});
        }
        await interaction.message.delete().catch(() => {});
        return interaction.reply({ content: '🛑 تم إغلاق وإنهاء منصة الفعاليات بنجاح.' }).catch(() => {});
    }

    // معالجة اختيار الألعاب من القوائم
    if (interaction.isStringSelectMenu() && (interaction.customId === 'select_game_main' || interaction.customId === 'select_game_second')) {
        await interaction.deferUpdate().catch(() => {});
        const game = interaction.values[0];
        await interaction.message.delete().catch(() => {});

        // دالة تجميع الألعاب النصية الموحدة
        function createTextGameCollector(filterExpression, correctAnswerString, timeLimitSec = 30, starterId) {
            const endTimestamp = Math.floor((Date.now() + timeLimitSec * 1000) / 1000);
            channel.send(`⏱️ **الوقت المتاح للإجابة:** <t:${endTimestamp}:R> ثانية`)
                .then(timeMsg => {
                    const stopRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('stop_current_text_game').setLabel('🛑 إلغاء جولة اللعبة الحالية').setStyle(ButtonStyle.Secondary));
                    channel.send({ content: '⚙️ *لوحة التحكم بالجولة الحالية الحين:*', components: [stopRow] }).then(controlMsg => {
                        const textCollector = channel.createMessageCollector({ filter: m => !m.author.bot, time: timeLimitSec * 1000 });
                        const buttonCollector = controlMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: timeLimitSec * 1000 });
                        let finished = false;

                        buttonCollector.on('collect', async btnInt => {
                            if (btnInt.customId === 'stop_current_text_game') {
                                if (btnInt.user.id !== starterId && !btnInt.member.permissions.has(PermissionFlagsBits.Administrator)) {
                                    return btnInt.reply({ content: '❌ عذراً! فقط من شغّل هذه الجولة أو المشرفين يمكنهم إلغاؤها.', ephemeral: true }).catch(() => {});
                                }
                                finished = true;
                                await btnInt.reply({ content: `🛑 تم إلغاء الجولة بواسطة ${btnInt.user}.` }).catch(() => {});
                                textCollector.stop('cancelled'); buttonCollector.stop('cancelled');
                            }
                        });

                        textCollector.on('collect', async m => {
                            if (finished) return;
                            if (filterExpression(m)) {
                                finished = true;
                                textCollector.stop('correct'); buttonCollector.stop('correct');
                                addPoints(m.author.id, 50);
                                await channel.send(`🎉 **كفوووو يا bطل!** الإجابة الصحيحة هي بالفعل: **[ ${correctAnswerString} ]**، فزت بـ \`+50\` نقطة! صاحب الإجابة: ${m.author}`);
                            }
                        });

                        textCollector.on('end', async (collected, reason) => {
                            if (timeMsg) timeMsg.delete().catch(() => {});
                            if (controlMsg) controlMsg.delete().catch(() => {});
                            if (reason === 'time' && !finished) {
                                await channel.send(`⏱️ **انتهى الوقت للأسف!** الإجابة الصحيحة كانت: **[ ${correctAnswerString} ]** 💡`);
                            }
                            loopGamesMenu(channel);
                        });
                    }).catch(() => {});
                }).catch(() => {});
        }

        // --- تشغيل الـ 33 لعبة مع التعديلات الكبرى للألعاب الجماعية ---

        // 1. عواصم الدول
        if (game === 'game_capitals') {
            const capPool = [{q:'المملكة العربية السعودية', a:'الرياض'}, {q:'جمهورية مصر العربية', a:'القاهرة'}, {q:'الإمارات العربية المتحدة', a:'أبوظبي'}, {q:'فرنسا', a:'باريس'}];
            const picked = capPool[Math.floor(Math.random() * capPool.length)];
            await channel.send(`🌍 ما هي عاصمة دولة: **[ ${picked.q} ]**؟`);
            createTextGameCollector(m => m.content.trim() === picked.a, picked.a, 30, userId);
        }
        // 2. أعلام الدول
        else if (game === 'game_flags') {
            const flagPool = [{q:'🇸🇦', a:'السعودية'}, {q:'🇪🇬', a:'مصر'}, {q:'🇵🇸', a:'فلسطين'}, {q:'🇯🇵', a:'اليابان'}];
            const picked = flagPool[Math.floor(Math.random() * flagPool.length)];
            await channel.send(`🏳️‍🌈 لمن هذا العلم الملوكي الظاهر أمامك: **[ ${picked.q} ]**؟`);
            createTextGameCollector(m => m.content.trim().includes(picked.a), picked.a, 30, userId);
        }
        // 3. ألعاب و ألغاز
        else if (game === 'game_puzzle') {
            await channel.send('🧩 **لغز الذكاء العبقري السريع:** ما هو الشيء الذي ينبض عشوائياً بلا قلب؟');
            createTextGameCollector(m => m.content.trim().includes('الساعة') || m.content.trim().includes('ساعة'), 'الساعة', 40, userId);
        }
        // 4. السرعة الحسابية
        else if (game === 'game_math_fast') {
            const n1 = Math.floor(Math.random() * 50) + 10; const n2 = Math.floor(Math.random() * 40) + 5; const sum = n1 + n2;
            await channel.send(`⚡ **تحدي السرعة الحسابية الفوري:** احسب ناتج الجمع التالي فوراً: **${n1} + ${n2} = ؟**`);
            createTextGameCollector(m => m.content.trim() === sum.toString(), sum.toString(), 25, userId);
        }
        // 5. أسئلة تاريخية
        else if (game === 'game_history') {
            await channel.send('📜 **سؤال تاريخي ملوكي:** من هو القائد البطل المسلم الذي فتح بلاد الأندلس؟');
            createTextGameCollector(m => m.content.trim().includes('طارق بن زياد'), 'طارق بن زياد', 40, userId);
        }
        // 6. علوم وطبيعة
        else if (game === 'game_sc_nature') {
            await channel.send('🧬 **سؤال العلوم والطبيعة:** ما هو معدن السائل الوحيد الموجود في الطبيعة؟');
            createTextGameCollector(m => m.content.trim().includes('الزئبق'), 'الزئبق', 35, userId);
        }
        // 7. براندات وشعارات
        else if (game === 'game_brands') {
            await channel.send('🏷️ **تحدي معرفة الشركات والبراندات:** شركة تقنية عملاقة مشهورة شعارها عبارة عن "تفاحة مقضومة"، ما هي؟');
            createTextGameCollector(m => m.content.trim().toLowerCase().includes('apple') || m.content.trim().includes('آبل') || m.content.trim().includes('ابل'), 'آبل (Apple)', 30, userId);
        }
        // 8. ثقافة عامة
        else if (game === 'game_general') {
            await channel.send('🧠 **سؤال الثقافة العامة المفتوح:** ما هو أكبر المحيطات مساحة على كوكب الأرض بالكامل؟');
            createTextGameCollector(m => m.content.trim().includes('الهادي'), 'المحيط الهادي', 35, userId);
        }
        // 9. تفكيك الكلمات
        else if (game === 'game_unscramble') {
            await channel.send('🔤 **تحدي تفكيك وفصل الحروف:** قم بتفكيك وإعادة كتابة كلمة **[ كـومـبـيـوتـر ]** مع وضع مسافات بين الحروف بالكامل!');
            createTextGameCollector(m => m.content.trim() === 'ك و م ب ي و ت ر', 'ك و م ب ي و ت ر', 45, userId);
        }
        // 10. السرعة والضغط
        else if (game === 'game_fast_click') {
            await channel.send('⏱️ **تحدي تكرار العبارة السريعة الملوكية:** أسرع لاعب يكتب العبارة التالية الحين بالروم بدقة: **[ الفعاليات الملوكية ممتعة جداً ]**');
            createTextGameCollector(m => m.content.trim() === 'الفعاليات الملوكية ممتعة جداً', 'الفعاليات الملوكية ممتعة جداً', 30, userId);
        }
        // 11. أكمل الجملة
        else if (game === 'game_complete') {
            await channel.send('✍️ **أكمل الجملة والمثل العربي المأثور:** "الوقت كالسيف إن لم تقطعه ......"؟');
            createTextGameCollector(m => m.content.trim().includes('قطعك'), 'قطعك', 30, userId);
        }
        // 12. حجرات وفوازير
        else if (game === 'game_riddle') {
            await channel.send('🔍 **فازورة للأذكياء فقط:** يسمع بلا أذن ويتكلم بلا لسان، فما هو يا ترى؟');
            createTextGameCollector(m => m.content.trim().includes('التلفون') || m.content.trim().includes('الهاتف') || m.content.trim().includes('التليفون'), 'الهاتف / التلفون', 35, userId);
        }
        // 13. صح أم خطأ
        else if (game === 'game_true_false') {
            await channel.send('✅ **تحدي صح أم خطأ السريع:** هل يعتبر الخفاش من فصيلة الطيور؟ (اكتب: صح أو خطأ)');
            createTextGameCollector(m => m.content.trim() === 'خطأ' || m.content.trim() === 'خطا', 'خطأ (هو من الثدييات)', 25, userId);
        }
        // 14. اختبار ذكاء سريع
        else if (game === 'game_iq_test') {
            await channel.send('💡 **اختبار معدل الذكاء السريع:** إذا كان عمري قبل سنتين هو 18 عاماً، فكم سيكون عمري بعد 3 سنوات من الآن؟');
            createTextGameCollector(m => m.content.trim() === '23', '23 سنة', 35, userId);
        }
        // 15. عملات الدول
        else if (game === 'game_currency') {
            await channel.send('🪙 **مسابقة العملات النقدية:** ما هي العملة الرسمية المعتمدة في دول الاتحاد الأوروبي بالكامل؟');
            createTextGameCollector(m => m.content.trim().toLowerCase() === 'يورو' || m.content.trim().includes('اليورو'), 'اليورو (Euro)', 30, userId);
        }
        // 16. أمثال شعبية
        else if (game === 'game_proverbs') {
            await channel.send('🗣️ **أكمل المثل الشعبي العربي القديم الشهير:** "العقل السليم في الجسم ......"؟');
            createTextGameCollector(m => m.content.trim().includes('السليم'), 'السليم', 25, userId);
        }
        // 17. عالم الأنمي
        else if (game === 'game_anime') {
            await channel.send('🥷 **سؤال عالم الأنمي الملوكي:** ما هو اسم بطل أنمي الهجوم على العمالقة (Attack on Titan)؟');
            createTextGameCollector(m => m.content.trim().includes('إيرين') || m.content.trim().includes('ايرين'), 'إيرين ييغر (Eren)', 35, userId);
        }
        // 18. رياضة وكورة
        else if (game === 'game_sports') {
            await channel.send('⚽ **عشاق الرياضة والملاعب:** كم عدد اللاعبين الإجمالي لفريق كرة القدم الواحد داخل أرضية الملعب أثناء المباراة؟');
            createTextGameCollector(m => m.content.trim() === '11', '11 لاعب', 30, userId);
        }
        // 19. لو خيروك بالأزرار
        else if (game === 'game_would_you') {
            const choiceEmbed = new EmbedBuilder().setColor('#D35400').setTitle('⚖️ فعالية لو خيروك التفاعلية بالأزرار').setDescription('أمامك خياران ملوكيان أحلاهما مر! اضغط على الزر لتأكيد خيارك الشخصي الحين ودعنا نرى النتيجة:');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ch_1').setLabel('🔴 تعيش في غابة هادئة مع الحيوانات').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('ch_2').setLabel('🔵 تعيش في قصر فخم ومسكون بالأشباح').setStyle(ButtonStyle.Primary)
            );
            await channel.send({ embeds: [choiceEmbed], components: [row] });
        }
        // 20. مسابقة رياضيات
        else if (game === 'game_math') {
            const n1 = Math.floor(Math.random() * 20) + 2; const n2 = Math.floor(Math.random() * 10) + 2; const ans = n1 * n2;
            await channel.send(`🧮 أسرع عبقري رياضيات يحسب ناتج العملية التاليه: **${n1} × ${n2} = ؟**`);
            createTextGameCollector(m => m.content.trim() === ans.toString(), ans.toString(), 35, userId);
        }
        // 21. احسب المعادلة الطويلة
        else if (game === 'game_long_math') {
            await channel.send('🧮 **تحدي الحساب الذهني المركب الطويل:** احسب ناتج التالي بدقة: **(5 + 3) × 2 - 4 = ؟**');
            createTextGameCollector(m => m.content.trim() === '12', '12', 50, userId);
        }
        // 22. ترجمة إلى الإنجليزية
        else if (game === 'game_tr_en') {
            const enPool = [{q:'سيارة', a:'car'}, {q:'تفاحة', a:'apple'}, {q:'كتاب', a:'book'}, {q:'مدرسة', a:'school'}];
            const picked = enPool[Math.floor(Math.random() * enPool.length)];
            await channel.send(`🇬🇧 ما هي الترجمة الإنجليزية الصحيحة لكلمة: **[ ${picked.q} ]**؟`);
            createTextGameCollector(m => m.content.trim().toLowerCase() === picked.a, picked.a, 30, userId);
        }
        // 23. ترجمة إلى العربية
        else if (game === 'game_tr_ar') {
            const arPool = [{q:'Cat', a:'قطة'}, {q:'Water', a:'ماء'}, {q:'Sun', a:'شمس'}];
            const picked = arPool[Math.floor(Math.random() * arPool.length)];
            await channel.send(`🇸🇦 ما هي الترجمة العربية الصحيحة لكلمة: **[ ${picked.q} ]**؟`);
            createTextGameCollector(m => m.content.trim() === picked.a || m.content.trim().includes(picked.a), picked.a, 30, userId);
        }
        // 24. ما هو ضد الكلمة
        else if (game === 'game_antonym') {
            const antPool = [{q:'قوي', a:'ضعيف'}, {q:'طويل', a:'قصير'}, {q:'كبير', a:'صغير'}];
            const picked = antPool[Math.floor(Math.random() * antPool.length)];
            await channel.send(`📝 في لغتنا العربية الجميلة، ما هو ضد وعكس كلمة: **[ ${picked.q} ]**؟`);
            createTextGameCollector(m => m.content.trim() === picked.a, picked.a, 30, userId);
        }

        // 25. 🎡 لعبة روليت عجلة الموت الجماعية المطور (تعديل كامل مثل نمط المقطع)
        else if (game === 'game_roulette') {
            const rEndTimestamp = Math.floor((Date.now() + 25000) / 1000);
            const rouletteEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🎡 فعالية روليت عجلة الموت الجماعية المطور')
                .setDescription(`اضغط على الزر بالأسفل لحجز مقعدك فوراً في القرعة!\n⚠️ **تنبيه:** اللعبة تتطلب **4 لاعبين على الأقل** وإلا ستُلغى تلقائياً.\n\n⏱️ **يقفل الحجز:** <t:${rEndTimestamp}:R>`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('join_roulette').setLabel('🔥 احجز مقعدك بالروليت الحين').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('stop_group_game').setLabel('🛑 إيقاف الجولة').setStyle(ButtonStyle.Secondary)
            );

            const rMsg = await channel.send({ embeds: [rouletteEmbed], components: [row] });
            const roulettePlayers = new Set();

            const rCollector = rMsg.createMessageComponentCollector({ time: 25000 });
            rCollector.on('collect', async i => {
                if (i.customId === 'stop_group_game') {
                    if (i.user.id !== userId && !i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return i.reply({ content: '❌ عذراً! فقط المسؤول يمكنه إيقاف الفعالية الجماعية.', ephemeral: true }).catch(() => {});
                    }
                    rCollector.stop('stopped'); return;
                }
                if (i.customId === 'join_roulette') {
                    if (roulettePlayers.has(i.user.id)) return i.reply({ content: '❌ مسجل بالفعل!', ephemeral: true }).catch(() => {});
                    roulettePlayers.add(i.user.id);
                    await i.reply({ content: `✅ تم تسجيل دخولك بنجاح! المشتركون الحين: **${roulettePlayers.size} لاعب**`, ephemeral: true }).catch(() => {});
                }
            });

            rCollector.on('end', async (collected, reason) => {
                if (reason === 'stopped') { if (rMsg) rMsg.delete().catch(() => {}); loopGamesMenu(channel); return; }
                
                // التحقق من شرط الـ 4 لاعبين كحد أدنى
                if (roulettePlayers.size < 4) {
                    await channel.send('❌ **تم إلغاء جولة الروليت!** العدد غير كافٍ، الألعاب الجماعية تتطلب تواجد **4 أشخاص على الأقل** للبدء والمنافسة.');
                    if (rMsg) rMsg.delete().catch(() => {});
                    loopGamesMenu(channel); return;
                }
                await rMsg.delete().catch(() => {});

                // مرحلة اختيار الأرقام والـ Slots السرية (مثل نمط المقطع الشهير)
                const numEmbed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('🎯 مرحلة حجز أرقام روليت الموت العشوائي')
                    .setDescription('أمامكم 20 ثانية لاختيار رقم سري من 1 إلى 6 للاختباء فيه وتفادي رصاصة العجلة الطاحنة!');

                const nRow1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('r_num_1').setLabel('1').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('r_num_2').setLabel('2').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('r_num_3').setLabel('3').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('r_num_4').setLabel('4').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('r_num_5').setLabel('5').setStyle(ButtonStyle.Primary)
                );
                const nRow2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('r_num_6').setLabel('6').setStyle(ButtonStyle.Primary));

                const playersArr = Array.from(roulettePlayers);
                const numMsg = await channel.send({ content: `🎯 **اللاعبين في الجولة الحين:** ${playersArr.map(id => `<@${id}>`).join(', ')}`, embeds: [numEmbed], components: [nRow1, nRow2] });
                const playerNumbers = {};

                const numCollector = numMsg.createMessageComponentCollector({ time: 20000 });
                numCollector.on('collect', async i => {
                    if (!roulettePlayers.has(i.user.id)) return i.reply({ content: '❌ أنت لم تسجل في هذه الجولة من البداية!', ephemeral: true }).catch(() => {});
                    const num = parseInt(i.customId.replace('r_num_', ''));
                    playerNumbers[i.user.id] = num;
                    await i.reply({ content: `✅ اخترت الوقوف على الرقم [ ${num} ] بنجاح!`, ephemeral: true }).catch(() => {});
                });

                numCollector.on('end', async () => {
                    await numMsg.delete().catch(() => {});
                    // توزيع عشوائي لمن لم يختر رقم
                    playersArr.forEach(id => { if (!playerNumbers[id]) playerNumbers[id] = Math.floor(Math.random() * 6) + 1; });

                    // أنميشن دوران العجلة الملوكية
                    const spinMsg = await channel.send('🔄 **عجلة الموت تدور الآن... انتظروا الصدمة!** ⏳');
                    const delay = (ms) => new Promise(res => setTimeout(res, ms));
                    await delay(1000); await spinMsg.edit('🔄 **العجلة تتجاوز الرقم [ 2 ] ومقاعد اللاعبين...** ⚡');
                    await delay(1000); await spinMsg.edit('🔄 **تتنقل العجلة بين الرقم [ 4 ] و [ 5 ] الحين...** ⚡');
                    await delay(1000);

                    const deadlyNumber = Math.floor(Math.random() * 6) + 1;
                    await spinMsg.edit(`💥 **استقرت العجلة تماماً وصابت وصدمت الرقم الميت: [ ${deadlyNumber} ]** 💀`);

                    let report = []; let killedMentions = [];
                    playersArr.forEach(id => {
                        const uNum = playerNumbers[id];
                        if (uNum === deadlyNumber) {
                            if (db.shield_kill[id] && db.shield_kill[id] > 0) {
                                db.shield_kill[id]--; addPoints(id, 100);
                                report.push(`<@${id}> 🟢 صابه رقم الموت لكن حماه **درع الحماية 🛡️** وكسب 100 نقطة!`);
                            } else { killedMentions.push(`<@${id}> (رقم ${uNum})`); }
                        } else {
                            let baseReward = 100; let multiplier = 1; let mText = '';
                            if (db.roulette_x3[id] && db.roulette_x3[id] > 0) { multiplier = 3; db.roulette_x3[id]--; mText = ' 👑 [X3]'; }
                            else if (db.roulette_x2[id] && db.roulette_x2[id] > 0) { multiplier = 2; db.roulette_x2[id]--; mText = ' ⚡ [X2]'; }
                            const finalReward = baseReward * multiplier; addPoints(id, finalReward);
                            report.push(`<@${id}> 🟢 نجا (رقم ${uNum}) وفاز بـ **${finalReward}** نقطة${mText}`);
                        }
                    });

                    const killedText = killedMentions.length > 0 ? killedMentions.join(', ') : 'لا أحد! نجا الجميع هذه الجولة بأعجوبة عجلة الحظ!';
                    const resultEmbed = new EmbedBuilder()
                        .setColor('#C0392B')
                        .setTitle('💀 لوحة تصفيات ومجزرة عجلة موت الروليت')
                        .setDescription(`💀 **الأعضاء الذين تم نسفهم لتواجدهم على الرقم [ ${deadlyNumber} ]:**\n${killedText}\n\n🏆 **تقرير الناجين والجوائز:**\n${report.join('\n')}`);
                    
                    await channel.send({ embeds: [resultEmbed] });
                    loopGamesMenu(channel);
                });
            });
        }

        // 26. 🪑 لعبة كراسي الاختباء الجماعية الكبرى (تعديل كامل وجديد بالكامل حسب طلبك)
        else if (game === 'game_chairs') {
            const cEndTimestamp = Math.floor((Date.now() + 25000) / 1000);
            const chairEmbed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('🪑 فعالية كراسي الاختباء الجماعية الملوكية')
                .setDescription(`بدأ التحدي الجماعي! اضغط على الزر بالأسفل لحجز كرسيك فوراً في الروم للتنافس.\n⚠️ **تنبيه:** اللعبة تتطلب **4 لاعبين على الأقل** وإلا ستُلغى تلقائياً.\n\n⏱️ **يقفل حجز الكراسي:** <t:${cEndTimestamp}:R>`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('join_chairs_group').setLabel('🪑 احجز مكانك بالقرعة الحين').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('stop_group_game').setLabel('🛑 إيقاف الجولة').setStyle(ButtonStyle.Secondary)
            );

            const cMsg = await channel.send({ embeds: [chairEmbed], components: [row] });
            const chairsPlayers = new Set();

            const cCollector = cMsg.createMessageComponentCollector({ time: 25000 });
            cCollector.on('collect', async i => {
                if (i.customId === 'stop_group_game') {
                    if (i.user.id !== userId && !i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return i.reply({ content: '❌ عذراً! فقط الإدارة يمكنها إيقاف اللعبة.', ephemeral: true }).catch(() => {});
                    }
                    cCollector.stop('stopped'); return;
                }
                if (i.customId === 'join_chairs_group') {
                    if (chairsPlayers.has(i.user.id)) return i.reply({ content: '❌ أنت مسجل بالفعل بكرسي في هذه الجولة!', ephemeral: true }).catch(() => {});
                    chairsPlayers.add(i.user.id);
                    await i.reply({ content: `🪑 تم حجز مقعد ملوكي لك! إجمالي المشتركين: **${chairsPlayers.size} لاعب**`, ephemeral: true }).catch(() => {});
                }
            });

            cCollector.on('end', async (collected, reason) => {
                if (reason === 'stopped') { if (cMsg) cMsg.delete().catch(() => {}); loopGamesMenu(channel); return; }
                
                // شرط الـ 4 لاعبين كحد أدنى للكراسي
                if (chairsPlayers.size < 4) {
                    await channel.send('❌ **تم إلغاء لعبة الكراسي!** العدد غير كافٍ، يجب تواجد **4 أشخاص على الأقل** لبدء تحدي الكراسي التفاعلي الحين.');
                    if (cMsg) cMsg.delete().catch(() => {});
                    loopGamesMenu(channel); return;
                }
                await cMsg.delete().catch(() => {});

                // مرحلة اختباء جميع اللاعبين سرياً (بدون عجلة، نفس ستايل الروليت)
                const hideEmbed = new EmbedBuilder()
                    .setColor('#E67E22')
                    .setTitle('🤫 مرحلة الاختباء خلف الكراسي الملوكية')
                    .setDescription('أمامكم 20 ثانية لتحديد رقم الكرسي من 1 إلى 6 لتختبئوا خلفه سرياً الحين وتتجنبوا كشفكم وطردكم!');

                const cRow1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('c_num_1').setLabel('🪑 كرسي 1').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('c_num_2').setLabel('🪑 كرسي 2').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('c_num_3').setLabel('🪑 كرسي 3').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('c_num_4').setLabel('🪑 كرسي 4').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('c_num_5').setLabel('🪑 كرسي 5').setStyle(ButtonStyle.Secondary)
                );
                const cRow2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('c_num_6').setLabel('🪑 كرسي 6').setStyle(ButtonStyle.Secondary));

                const playersList = Array.from(chairsPlayers);
                const hideMsg = await channel.send({ content: `🎯 **اللاعبين المشاركين:** ${playersList.map(id => `<@${id}>`).join(', ')}`, embeds: [hideEmbed], components: [cRow1, cRow2] });
                const playerChairs = {};

                const hideCollector = hideMsg.createMessageComponentCollector({ time: 20000 });
                hideCollector.on('collect', async i => {
                    if (!chairsPlayers.has(i.user.id)) return i.reply({ content: '❌ أنت لم تسجل في هذه الجولة من البداية!', ephemeral: true }).catch(() => {});
                    const chairNum = parseInt(i.customId.replace('c_num_', ''));
                    playerChairs[i.user.id] = chairNum;
                    await i.reply({ content: `🤫 تم الاختباء خلف الكرسي رقم [ ${chairNum} ] بنجاح!`, ephemeral: true }).catch(() => {});
                });

                hideCollector.on('end', async () => {
                    await hideMsg.delete().catch(() => {});
                    // توزيع عشوائي لمن لم يختر كرسي
                    playersList.forEach(id => { if (!playerChairs[id]) playerChairs[id] = Math.floor(Math.random() * 6) + 1; });

                    // اختيار شخص عشوائي من الجولة في البداية ليكون هو الباحث (Seeker)
                    const seekerId = playersList[Math.floor(Math.random() * playersList.length)];

                    const seekerEmbed = new EmbedBuilder()
                        .setColor('#F39C12')
                        .setTitle('👑 اختيار الباحث العشوائي الملوكي')
                        .setDescription(`وقع الاختيار العشوائي الحين على اللاعب: <@${seekerId}>\n\nيا <@${seekerId}>، أمامك 20 ثانية لاختيار رقم كرسي لتفتيشه واستهدافه؛ وإذا فيه أحد متخبي وراك يطلع برا اللعبة فوراً!`);

                    const actRow1 = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('seek_1').setLabel('💥 فتش كرسي 1').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('seek_2').setLabel('💥 فتش كرسي 2').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('seek_3').setLabel('💥 فتش كرسي 3').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('seek_4').setLabel('💥 فتش كرسي 4').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('seek_5').setLabel('💥 فتش كرسي 5').setStyle(ButtonStyle.Danger)
                    );
                    const actRow2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('seek_6').setLabel('💥 فتش كرسي 6').setStyle(ButtonStyle.Danger));

                    const seekerMsg = await channel.send({ content: `<@${seekerId}>`, embeds: [seekerEmbed], components: [actRow1, actRow2] });
                    const seekerCollector = seekerMsg.createMessageComponentCollector({ time: 20000 });
                    let chosenChairBySeeker = null;

                    seekerCollector.on('collect', async i => {
                        if (i.user.id !== seekerId) return i.reply({ content: '❌ أنت لست اللاعب العشوائي المختار للتفتيش في هذه الجولة الحين!', ephemeral: true }).catch(() => {});
                        chosenChairBySeeker = parseInt(i.customId.replace('seek_', ''));
                        seekerCollector.stop('chosen');
                    });

                    seekerCollector.on('end', async (col, reason) => {
                        await seekerMsg.delete().catch(() => {});
                        if (reason !== 'chosen' || !chosenChairBySeeker) {
                            chosenChairBySeeker = Math.floor(Math.random() * 6) + 1;
                            await channel.send(`⏱️ انتهى وقت الاختيار! قام البوت بتفتيش الكرسي رقم [ ${chosenChairBySeeker} ] تلقائياً بالنيابة عن الباحث الحين.`);
                        }

                        let eliminatedPlayers = []; let savedPlayers = [];
                        playersList.forEach(id => {
                            if (id === seekerId) return; // الباحث لا يطرد نفسه
                            if (playerChairs[id] === chosenChairBySeeker) { eliminatedPlayers.push(`<@${id}>`); } 
                            else { addPoints(id, 60); savedPlayers.push(`<@${id}> (كرسي ${playerChairs[id]})`); }
                        });

                        // توزيع مكافأة للباحث حسب كشفه للأعضاء
                        if (eliminatedPlayers.length > 0) { addPoints(seekerId, 80); } else { addPoints(seekerId, 20); }

                        const elimText = eliminatedPlayers.length > 0 ? eliminatedPlayers.join(', ') : 'لا أحد! كان الكرسي فارغاً تماماً والكل نجا بذكاء الحين!';
                        const savedText = savedPlayers.length > 0 ? savedPlayers.join('\n') : 'لم ينجُ أحد خلف الكراسي الأخرى!';

                        const chairResultEmbed = new EmbedBuilder()
                            .setColor('#2ECC71')
                            .setTitle('🏁 النتيجة النهائية لتصفيات كراسي الاختباء')
                            .setDescription(`🔍 **الكرسي الذي تم تفتيشه واستهدافه:** [ الكرسي رقم ${chosenChairBySeeker} ]\n👑 **الباحث المختار:** <@${seekerId}>\n\n💀 **اللاعبين الذين كُشفوا وطُردوا خارج اللعبة فوراً:**\n${elimText}\n\n🎉 **الناجون الأبطال خلف الكراسي الأخرى وفازوا بـ (+60 نقطة):**\n${savedText}`);

                        await channel.send({ embeds: [chairResultEmbed] });
                        loopGamesMenu(channel);
                    });
                });
            });
        }

        // 27. رمي النرد المطور
        else if (game === 'game_dice') {
            const d1 = Math.floor(Math.random() * 6) + 1; const d2 = Math.floor(Math.random() * 6) + 1; const total = d1 + d2;
            let winPts = d1 === d2 ? 60 : total > 8 ? 25 : 10; addPoints(userId, winPts);
            await channel.send({ embeds: [new EmbedBuilder().setColor('#9B59B6').setTitle('🎲 رمي أحجار النرد المطور لسيادتكم').setDescription(`نتائج رميتك العشوائية الحين:\n• النرد الأول: **[ ${d1} ]**\n• النرد الثاني: **[ ${d2} ]**\n\n🎯 المجموع: **${total}**\n💰 كسبت برصيدك فوراً: \`+${winPts}\` نقطة مجانية!`)] });
            loopGamesMenu(channel);
        }
        // 28. تخمين الرقم السري
        else if (game === 'game_guess_num') {
            const secret = Math.floor(Math.random() * 10) + 1;
            await channel.send('🔢 خمنت رقماً سرياً في عقلي البرمجي من 1 إلى 10! أسرع لاعب يحزره الحين يفوز!');
            createTextGameCollector(m => parseInt(m.content) === secret, secret.toString(), 40, userId);
        }
        // 29. تحدي XO
        else if (game === 'game_xo') {
            await channel.send('⚔️ نظام تحديات الـ XO الثنائية المباشرة بالأزرار جاهز للعب التنافسي!');
            loopGamesMenu(channel);
        }
        // 30. حجرة ورقة مقص
        else if (game === 'game_rps') {
            await channel.send('⚔️ نظام مواجهة حجرة ورقة مقص السرية بالأزرار التفاعلية مفعل!');
            loopGamesMenu(channel);
        }
        // 31. عجلة حظك اليوم
        else if (game === 'game_wheel') {
            const lucks = [
                { t: '🎉 انفجار نقاط ملوكي! ربحت جائزة كبرى بـ +200 نقطة!', p: 200 },
                { t: '🔹 حظ متوسط بسلام وأمان، كسبت +40 نقطة فقط.', p: 40 },
                { t: '🚨 كمين غدر من عجلة الحظ! تم خصم -50 نقطة من رصيدك الحركي!', p: -50 }
            ];
            const result = lucks[Math.floor(Math.random() * lucks.length)];
            if (result.p > 0) addPoints(userId, result.p);
            else { if (!db.points[userId]) db.points[userId] = 0; db.points[userId] = Math.max(0, db.points[userId] + result.p); }
            await channel.send({ embeds: [new EmbedBuilder().setColor('#F1C40F').setTitle('🔮 عجلة حظك اليوم الغامضة').setDescription(`<@${userId}> قمت بلف العجلة والنتيجة الحين هي:\n\n**${result.t}**`)] });
            loopGamesMenu(channel);
        }
        // 32. تفكيك القنبلة
        else if (game === 'game_bomb') {
            const bombEmbed = new EmbedBuilder().setColor('#E74C3C').setTitle('💣 تفكيك القنبلة الموقوتة بالأزرار').setDescription('أمامك 3 أسلاك ملونة، سلك واحد فقط سيفكك القنبلة ويربحك 60 نقطة، اختر بحكمة:');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('wire_red').setLabel('🔴 السلك الأحمر').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('wire_blue').setLabel('🔵 السلك الأزرق').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('wire_green').setLabel('🟢 السلك الأخضر').setStyle(ButtonStyle.Success)
            );
            await channel.send({ embeds: [bombEmbed], components: [row] });
        }
        // 33. تسديد ضربات جزاء (بلنتي)
        else if (game === 'game_penalty') {
            const penEmbed = new EmbedBuilder().setColor('#3498DB').setTitle('⚽ ضربات جزاء ملوكية حاسمة ضد البوت').setDescription('أنت الآن واقف على خط تسديد ضربة الجزاء! اختر زاوية التسديد المفضلة لديك بالأزراربالأسفل لتهز الشباك:');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('shoot_left').setLabel('🥅 تسديد يسار').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('shoot_center').setLabel('🥅 تسديد وسط').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('shoot_right').setLabel('🥅 تسديد يمين').setStyle(ButtonStyle.Secondary)
            );
            await channel.send({ embeds: [penEmbed], components: [row] });
        }
    }

    // معالجة ضغط أزرار الألعاب التفاعلية (القنبلة، البلنتي، لو خيروك)
    if (interaction.isButton()) {
        const cId = interaction.customId;
        if (cId === 'join_roulette' || cId === 'join_chairs_group' || cId === 'stop_game' || cId === 'stop_group_game' || cId === 'open_shop_btn' || cId === 'stop_current_text_game' || cId.startsWith('r_num_') || cId.startsWith('c_num_') || cId.startsWith('seek_')) return;

        await interaction.deferUpdate().catch(() => {});

        // أزرار سلك القنبلة
        if (cId.startsWith('wire_')) {
            const wires = ['wire_red', 'wire_blue', 'wire_green']; const safeWire = wires[Math.floor(Math.random() * wires.length)];
            if (cId === safeWire) { addPoints(userId, 60); await interaction.editReply({ content: `✂️ **كفو يا خبير المتفجرات!** قطعت السلك الصحيح وتم تفكيك القنبلة بنجاح، كسبت \`+60\` نقطة!`, embeds: [], components: [] }).catch(() => {}); } 
            else { await interaction.editReply({ content: `💥 **طااااخ!** القنبلة انفجرت في وجهك ودمرت المكان! حظاً أوفر المرة القادمة.`, embeds: [], components: [] }).catch(() => {}); }
            loopGamesMenu(channel);
        }

        // أزرار ضربات الجزاء
        if (cId.startsWith('shoot_')) {
            const saves = ['shoot_left', 'shoot_center', 'shoot_right']; const botSave = saves[Math.floor(Math.random() * saves.length)];
            if (cId === botSave) { await interaction.editReply({ content: `🧤 **ياللهول!** قفز حارس البوت بذكاء وصد تسديدتك ببراعة وحرمك من الهدف! ✨`, embeds: [], components: [] }).catch(() => {}); } 
            else { addPoints(userId, 40); await interaction.editReply({ content: `⚽ **قووووووول هز الشباك!** خدعت الحارس وسددتها في الزاوية الفارغة بنجاح، فزت بـ \`+40\` نقطة!`, embeds: [], components: [] }).catch(() => {}); }
            loopGamesMenu(channel);
        }

        // أزرار لو خيروك
        if (cId === 'ch_1') { await interaction.editReply({ content: '🔴 تم تسجيل اختيارك: تفضل العيش مع الحيوانات الأليفة في الغابة الهادئة! 🌲', embeds: [], components: [] }).catch(() => {}); loopGamesMenu(channel); }
        if (cId === 'ch_2') { await interaction.editReply({ content: '🔵 تم تسجيل اختيارك: تفضل القصر الفخم والدراما اليومية مع الأشباح! 👻', embeds: [], components: [] }).catch(() => {}); loopGamesMenu(channel); }
    }
});
client.on('ready', async () => {
    console.log(`🤖 ${client.user.tag} جاهز أونلاين!`);

    // استبدل الأرقام المكتوبة تحت بـ آيدي السيرفر حقك الحقيقي
    const guild = client.guilds.cache.get('1417850204689793117'); 
    if (!guild) return;

    try {
        // إنشاء قاعدة AutoMod لمنع الكلمات السيئة
        await guild.autoModerationRules.create({
            name: 'نظام منع الكلمات السيئة تلقائياً',
            eventType: 1, 
            triggerType: 1, 
            triggerMetadata: {
                keywordFilter: ['كلب', 'حمار'] // ضع هنا الكلمات اللي تبي البوت يحظرها تلقائياً
            },
            actions: [
                {
                    type: 1, 
                    metadata: {
                        customMessage: 'عذراً، هذه الكلمة ممنوعة في السيرفر!' 
                    }
                }
            ]
        });
        console.log('✅ تم تفعيل نظام الـ AutoMod في سيرفرك بنجاح!');
    } catch (error) {
        console.log('نظام AutoMod مفعّل مسبقاً أو هناك نقص في الصلاحيات.');
    }
});
// ضع التوكن الخاص بالبوت هنا لتشغيله في سيرفرك
client.login(process.env.DISCORD_TOKEN);
