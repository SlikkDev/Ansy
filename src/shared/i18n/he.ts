// עברית. נכתב בעברית, לא מתורגם מהאנגלית. השם תמיד אָנְסִי, עם ניקוד.
import type { MessageKey } from './en'

export const he: Record<MessageKey, string> = {
  'app.name': 'אָנְסִי',
  'app.by': 'מבית Slikk.Dev',
  'app.tagline': 'האתר שלכם נראה מעולה. בשבילכם.',

  'skip.site': 'קפיצה לאתר',
  'skip.panel': 'קפיצה לחוויות',

  'toolbar.back': 'אחורה',
  'toolbar.forward': 'קדימה',
  'toolbar.reload': 'טעינה מחדש',
  'toolbar.stop': 'עצירה',
  'toolbar.settings': 'הגדרות',
  'toolbar.about': 'אודות אָנְסִי',
  'toolbar.theme': 'ערכת נושא בהירה',

  'address.label': 'כתובת האתר',
  'address.placeholder': 'הקלידו את כתובת האתר שלכם, למשל example.com',
  'address.go': 'פתיחה',
  'address.invalid': 'זה לא נראה כמו כתובת אינטרנט. נסו משהו כמו example.com.',

  'site.loading': 'טוען…',
  'site.empty': 'אין אתר פתוח',
  'site.focus': 'קפיצה לתוך האתר',
  'site.region': 'האתר שלכם',

  'welcome.title': 'האתר שלכם נראה מעולה. בשבילכם.',
  'welcome.body':
    'אָנְסִי מאפשר לכם להשתמש באתר שלכם כמו שמשתמשים בו אנשים עם מוגבלות, עם הכלים שהם נעזרים בהם. הקלידו למעלה את כתובת האתר כדי להתחיל.',
  'welcome.hint': 'טיפ: לחיצה על {shortcut} מחזירה אתכם לשורת הכתובת בכל רגע.',
  'welcome.practice': 'או מנסים את חנות התרגול',
  'welcome.practiceHint': 'חנות קטנה שנבנתה עם הטעויות הרגילות, כדי לנסות עליה את החוויות.',

  'error.title': 'אָנְסִי לא הצליח לפתוח את הדף הזה',
  'error.body': 'בדקו את הכתובת ואת החיבור לאינטרנט, ונסו שוב.',
  'error.retry': 'לנסות שוב',

  'panel.title': 'חוויות',
  'panel.intro':
    'בוחרים חוויה. כל חוויה משנה איך האתר שלכם נראה, נשמע או מגיב, כך שתפגשו את המחסום בעצמכם.',
  'panel.soon': 'בקרוב',

  'exp.colorBlindness': 'עיוורון צבעים',
  'exp.blurLowContrast': 'ראייה מטושטשת וניגודיות נמוכה',
  'exp.reader': 'קורא המסך Ansy Reader',
  'exp.zoom': 'הגדלה ל־200% ול־400%',
  'exp.largeText': 'טקסט גדול וריווח רחב',
  'exp.highContrast': 'ניגודיות גבוהה',
  'exp.keyboard': 'מקלדת בלבד',
  'exp.noSound': 'בלי סאונד',
  'exp.motion': 'רגישות לתנועה',
  'exp.scan': 'סריקה אוטומטית',

  'settings.title': 'הגדרות',
  'settings.language': 'שפה',
  'settings.theme': 'ערכת נושא',
  'settings.theme.dark': 'כהה',
  'settings.theme.light': 'בהירה',
  'settings.theme.system': 'לפי המערכת',
  'settings.updates': 'לבדוק אם יש עדכונים כשאָנְסִי נפתח',
  'settings.close': 'סגירה',

  'lang.en': 'English',
  'lang.he': 'עברית',

  'about.title': 'אודות אָנְסִי',
  'about.version': 'גרסה {version}',
  'about.body':
    'דפדפן חינמי בקוד פתוח למחשב, שמאפשר לחוות את האתר שלכם כמו שחווים אותו אנשים עם מוגבלות, כולל הכלים שהם נעזרים בהם. אָנְסִי הוא כלי לבדיקה ולהזדהות. הוא אף פעם לא משנה את האתר שלכם.',
  'about.disclaimer':
    'אָנְסִי מראה איך האתר שלכם מתנהג עבור חלק מהאנשים עם מוגבלות והכלים שהם נעזרים בהם. הוא לא יכול לאשר שהאתר עומד בדרישות WCAG, תקן 5568, ה־ADA או חוק הנגישות האירופי. רק בדיקה מלאה בידי איש מקצוע מוסמך יכולה.',
  'about.license':
    'הקוד ברישיון MIT. השם והלוגו של Slikk.Dev הם סימני מסחר של Slikk.Dev, וכל הזכויות בהם שמורות.',
  'about.source': 'קוד המקור ב־GitHub',
  'about.builtBy': 'נבנה על ידי',
  'about.credit': 'נבנה על ידי Slikk.Dev, פותח את slikk.dev בדפדפן שלכם',
  'about.close': 'סגירה',
  'about.updates': 'עדכונים',
  'about.privacy': 'הצהרת הפרטיות',

  'update.checkNow': 'בדיקה עכשיו',
  'update.checking': 'אָנְסִי בודק…',
  'update.none': 'אָנְסִי {version} מעודכן.',
  'update.downloading': 'אָנְסִי {version} בהורדה… {percent}%',
  'update.ready': 'אָנְסִי {version} מוכן. הפעילו מחדש כדי לעדכן.',
  'update.restart': 'הפעלה מחדש',
  'update.later': 'אחר כך',
  'update.error': 'לא הצלחנו לבדוק אם יש עדכון. נסו שוב מאוחר יותר.',
  'update.unsupported': 'הגרסה הזאת מתעדכנת דרך החנות או מנהל החבילות שממנו הותקנה.',
  'update.privacy':
    'בדיקת העדכון שואלת את GitHub Releases מהי הגרסה האחרונה, ולא שולחת דבר עליכם או על האתרים שלכם.',

  'menu.file': 'קובץ',
  'menu.edit': 'עריכה',
  'menu.view': 'תצוגה',
  'menu.window': 'חלון',
  'menu.help': 'עזרה',
  'menu.quit': 'יציאה מאָנְסִי',
  'menu.undo': 'ביטול',
  'menu.redo': 'ביצוע מחדש',
  'menu.cut': 'גזירה',
  'menu.copy': 'העתקה',
  'menu.paste': 'הדבקה',
  'menu.selectAll': 'בחירת הכול',
  'menu.toggleFullScreen': 'מסך מלא',
  'menu.minimize': 'מזעור',
  'menu.close': 'סגירת החלון',
  'menu.about': 'אודות אָנְסִי',
  'menu.checkUpdates': 'בדיקת עדכונים…',
  'menu.github': 'אָנְסִי ב־GitHub',
  'menu.website': 'האתר של אָנְסִי',
  'panel.on': 'פעיל',
  'panel.turnOn': 'הפעלה',
  'panel.turnOff': 'כיבוי',
  'panel.noSite': 'קודם פותחים את האתר, ואז מפעילים חוויה.',
  'panel.whatHappens': 'מה משתנה',
  'panel.lookFor': 'למה לשים לב',
  'panel.noticed': 'מה אָנְסִי שם לב אליו בעמוד הזה',
  'panel.noticedPending': 'בודק את העמוד…',
  'panel.status.on': '{name}: פעיל',
  'panel.status.off': '{name}: כבוי',
  'panel.options': 'אפשרויות',
  'panel.back': 'כל החוויות',

  'fidelity.label': 'נאמנות',
  'fidelity.high': 'קרוב מאוד למציאות',
  'fidelity.medium': 'קירוב',

  'exp.colorBlindness.what':
    'אָנְסִי צובע את האתר מחדש כמו שהסימולציה של כרום עושה, לפי סוג עיוורון הצבעים שבחרתם. בערך אחד מכל 12 גברים ואחת מכל 200 נשים רואים צבעים כך.',
  'exp.colorBlindness.look':
    'כל דבר שמסופר בצבע בלבד: שגיאה באדום, ״במלאי״ בירוק, שלב מודגש.\nקישורים שנבדלים מהטקסט שסביבם רק בצבע.\nגרפים, מידות או דוגמיות צבע שכבר אי אפשר להבדיל ביניהם.',
  'exp.colorBlindness.fidelity':
    'הסימולציה של Chromium עצמו, אותה אחת שכלי המפתחים של כרום משתמשים בה.',
  'exp.colorBlindness.mode': 'סוג',
  'exp.vision.deuteranopia': 'אדום-ירוק (דאוטרנופיה, הנפוץ ביותר)',
  'exp.vision.protanopia': 'אדום-ירוק (פרוטנופיה)',
  'exp.vision.tritanopia': 'כחול-צהוב (טריטנופיה)',
  'exp.vision.achromatopsia': 'בלי צבע בכלל (אכרומטופסיה)',

  'exp.blurLowContrast.what':
    'אָנְסִי מטשטש את העמוד או מרוקן ממנו את הניגודיות, כמו שהוא נראה למי שיש לו ראייה חלשה, קטרקט, או מסך סדוק בשמש.',
  'exp.blurLowContrast.look':
    'טקסט קטן או דק שכבר אי אפשר לקרוא.\nטקסט אפור על לבן, טקסט מציין מקום ותוויות בהירות שנעלמות.\nכפתורים ושדות שהקצוות שלהם נעלמים.',
  'exp.blurLowContrast.fidelity':
    'רמת טשטוש אחת ורמת ניגודיות אחת; ראייה חלשה אמיתית שונה מאוד מאדם לאדם.',
  'exp.blurLowContrast.mode': 'סוג',
  'exp.blur.blurredVision': 'ראייה מטושטשת',
  'exp.blur.reducedContrast': 'ניגודיות נמוכה',

  'exp.zoom.what':
    'אָנְסִי מגדיל את האתר כמו שדפדפן עושה, או מציג אותו ברוחב 320 פיקסלים, הרוחב הצר ביותר שעמוד עדיין חייב לעבוד בו.',
  'exp.zoom.look':
    'גלילה הצידה כדי לקרוא שורה.\nתוכן חתוך, חופף, או מוסתר מאחורי משהו אחר.\nתפריטים וכפתורים שכבר אי אפשר להגיע אליהם.',
  'exp.zoom.fidelity': 'הגדלה אמיתית של הדפדפן, בדיוק כמו ללחוץ Ctrl ופלוס.',
  'exp.zoom.level': 'הגדלה',
  'exp.zoom.200': '200%',
  'exp.zoom.400': '400%',
  'exp.zoom.narrow': 'להציג את האתר ברוחב 320 פיקסלים במקום',

  'exp.largeText.what':
    'אָנְסִי מכפיל את גודל הטקסט שמוגדר בדפדפן, כמו שאנשים רבים מגדירים בדפדפן שלהם, ומרחיב את הריווח בין שורות, מילים ואותיות.',
  'exp.largeText.look':
    'טקסט שלא גדל בכלל.\nטקסט חתוך, חופף, או שנדחף החוצה מהתיבה שלו.\nכפתורים שהתווית שלהם כבר לא נכנסת.',
  'exp.largeText.fidelity': 'הגדרת גודל הגופן של הדפדפן עצמו, והריווח המדויק ש־WCAG בודק איתו.',
  'exp.largeText.size': 'טקסט ב־200%',
  'exp.largeText.spacing': 'ריווח רחב יותר בין שורות, מילים ואותיות',

  'exp.highContrast.what':
    'אָנְסִי צובע את האתר מחדש בערכת ניגודיות גבוהה של המערכת, כמו ש־Windows עושה למי שמפעיל אותה. צבעים ורקעים מוחלפים; נשארים רק קווי מתאר וטקסט.',
  'exp.highContrast.look':
    'כפתורים, קישורים או שדות שנעלמו.\nטקסט שצרוב בתוך תמונות, שנשאר בדיוק כמו שהיה.\nמצבים שמסופרים בצבע בלבד: איזו לשונית פתוחה, באיזה שדה יש שגיאה.',
  'exp.highContrast.fidelity':
    'מצב forced-colors של Chromium, אותו מנוע שמאחורי ערכות הניגודיות של Windows.',

  'exp.motion.what':
    'אָנְסִי אומר לאתר שהמבקר ביקש פחות תנועה, ואז סופר מה ממשיך לזוז. תנועה יכולה לגרום לסחרחורת, בחילה או מיגרנה.',
  'exp.motion.look':
    'אנימציות שממשיכות לרוץ אחרי הבקשה.\nוידאו או אודיו שמתחיל לבד.\nקרוסלות וטיקרים בלי דרך לעצור אותם.',
  'exp.motion.fidelity': 'אותו אות ״הפחתת תנועה״ שמערכת ההפעלה שולחת.',
  'exp.motion.animations': '{count} אנימציות עדיין רצות',
  'exp.motion.autoplay': '{count} פריטי מדיה מתנגנים לבד',
  'exp.motion.calm': 'שום דבר לא המשיך לזוז',

  'exp.noSound.what':
    'אָנְסִי משתיק את האתר ובודק בכל וידאו ונגן אם יש כתוביות. בלעדיהן, מה שהסאונד אמר פשוט אבד.',
  'exp.noSound.look':
    'סרטונים בלי כתוביות.\nכל דבר שמוסבר בסאונד בלבד: צלצול, קול, צפצוף על שגיאה.\nנגנים של YouTube או Vimeo: בודקים את הכתוביות שלהם ידנית.',
  'exp.noSound.fidelity':
    'ההשתקה מדויקת; בדיקת הכתוביות מכסה את המדיה של העמוד עצמו ומציינת את הנגנים שאי אפשר להציץ לתוכם.',
  'exp.noSound.media': '{count} פריטי וידאו או אודיו',
  'exp.noSound.noCaptions': '{count} בלי כתוביות',
  'exp.noSound.players': '{count} נגנים מוטמעים לבדוק ידנית',
  'exp.noSound.none': 'אין וידאו או אודיו בעמוד הזה',

  'exp.reader.what':
    'אָנְסִי קורא את האתר כמו שקורא מסך קורא אותו: מתוך עץ הנגישות של העמוד, לפי הסדר, פריט אחרי פריט, עם המקשים שמשתמשי קוראי מסך לוחצים. כל מה שהוא אומר מופיע בתמליל, כך שרואים בדיוק מה מבקר עיוור שומע, ולא יותר.',
  'exp.reader.look':
    'כפתורים, קישורים ותמונות שמוכרזים בלי שם, או עם שם שלא אומר כלום מחוץ להקשר.\nשדות טופס שלא אומרים מה להקליד.\nכותרות שמדלגות על רמות או חסרות, כך שאין מתווה לקפוץ דרכו.\nבלי ציוני דרך: אין ״ראשי״, אין ״ניווט״ לקפוץ אליו.\nכל דבר שמבינים רק אם רואים אותו.',
  'exp.reader.fidelity':
    'Ansy Reader קורא את עץ הנגישות של Chromium, אותו עץ שקוראי מסך אמיתיים מקבלים, עם המקשים היומיומיים של NVDA ו-JAWS. הוא לא NVDA, לא JAWS ולא VoiceOver: לאלה יש הרבה יותר פקודות ודרכים משלהם. למילה האחרונה עדיין צריך בודקים שמשתמשים בקורא מסך אמיתי.',
  'exp.reader.voice': 'הקראה בקול',
  'exp.reader.rate': 'מהירות',
  'exp.reader.rate.slow': 'איטי',
  'exp.reader.rate.normal': 'רגיל',
  'exp.reader.rate.fast': 'מהיר',
  'exp.reader.cover': 'כיסוי המסך',
  'exp.reader.coverHint': 'האתר נהיה שחור. נשארים רק עם האוזניים, כמו מבקר עיוור.',
  'exp.reader.voiceOk': 'קול: {name}',
  'exp.reader.noVoice': 'במחשב הזה לא מותקן קול ב{language}, ולכן Ansy Reader מציג את התמליל בלבד.',
  'exp.reader.noVoice.linux':
    'בלינוקס, מתקינים speech-dispatcher וקול כמו espeak-ng, ומפעילים את אָנְסִי מחדש.',
  'exp.reader.noVoice.darwin':
    'במק, מוסיפים קול תחת הגדרות המערכת, נגישות, תוכן מדובר, קול המערכת.',
  'exp.reader.noVoice.win32': 'בווינדוס, מוסיפים קול תחת הגדרות, שעה ושפה, דיבור.',
  'exp.reader.language.en': 'אנגלית',
  'exp.reader.language.he': 'עברית',
  'exp.reader.current': 'נקרא עכשיו',
  'exp.reader.nothing':
    'עדיין לא נקרא כלום. לוחצים לתוך האתר ומקישים על החץ למטה, או משתמשים בכפתורים כאן.',
  'exp.reader.counts':
    'כותרות {headings} · קישורים {links} · שדות טופס {fields} · ציוני דרך {landmarks}',
  'exp.reader.prev': 'הקודם',
  'exp.reader.next': 'הבא',
  'exp.reader.activate': 'הפעלה',
  'exp.reader.readAll': 'להמשיך לקרוא מכאן',
  'exp.reader.stop': 'עצירת ההקראה',
  'exp.reader.refresh': 'קריאת העמוד מחדש',
  'exp.reader.saveCurrent': 'שמירה כממצא',
  'exp.reader.keys': 'המקשים, כשהמיקוד באתר',
  'exp.reader.keys.list':
    '↓ ו-↑: הפריט הבא והקודם\nTab ו-Shift+Tab: הפקד הבא והקודם, כמו כל מבקר\nH: הכותרת הבאה · 1 עד 6: כותרת ברמה הזאת\nK: קישור · B: כפתור · F: שדה טופס · E: שדה טקסט · L: רשימה · G: תמונה · D: ציון דרך · T: טבלה\nShift עם אות: הקודם\nEnter או רווח: הפעלה של מה שנקרא\nCtrl+Home ו-Ctrl+End: תחילת העמוד וסופו\nCtrl לבד: השתקת ההקראה\nEscape: יציאה משדה טקסט והמשך הקריאה',
  'exp.reader.transcript': 'תמליל',
  'exp.reader.transcriptEmpty': 'מה ש-Ansy Reader אומר מופיע כאן.',
  'exp.reader.clear': 'ניקוי התמליל',
  'exp.reader.mode.browse': 'מצב עיון: המקשים מזיזים את הקורא',
  'exp.reader.mode.focus': 'מצב מיקוד: המקשים הולכים לשדה',

  'reader.page':
    '{title}. העמוד נטען. כותרות: {headings}. קישורים: {links}. שדות טופס: {fields}. ציוני דרך: {landmarks}.',
  'reader.untitled': 'עמוד ללא כותרת',
  'reader.truncated': 'העמוד ארוך; אָנְסִי קורא את {count} הפריטים הראשונים שלו.',
  'reader.empty': 'אין מה לקרוא. קודם פותחים עמוד.',
  'reader.top': 'תחילת העמוד',
  'reader.bottom': 'סוף העמוד',
  'reader.noNext': 'אין עוד {what} קדימה',
  'reader.noPrev': 'אין עוד {what} אחורה',
  'reader.what.heading': 'כותרת',
  'reader.what.headingLevel': 'כותרת רמה {level}',
  'reader.what.link': 'קישור',
  'reader.what.button': 'כפתור',
  'reader.what.field': 'שדה טופס',
  'reader.what.edit': 'שדה טקסט',
  'reader.what.list': 'רשימה',
  'reader.what.image': 'תמונה',
  'reader.what.landmark': 'ציון דרך',
  'reader.what.table': 'טבלה',
  'reader.mode.browse': 'מצב עיון',
  'reader.mode.focus': 'מצב מיקוד',
  'reader.blank': 'ריק',
  'reader.unnamed': '(בלי שם)',
  'reader.wholePage': 'העמוד כולו',
  'reader.role.heading': 'כותרת רמה {level}',
  'reader.role.link': 'קישור',
  'reader.role.button': 'כפתור',
  'reader.role.edit': 'עריכה',
  'reader.role.multiline': 'רב-שורתי',
  'reader.role.combobox': 'תיבה משולבת',
  'reader.role.listbox': 'תיבת רשימה',
  'reader.role.checkbox': 'תיבת סימון',
  'reader.role.radio': 'כפתור בחירה',
  'reader.role.switch': 'מתג',
  'reader.role.slider': 'מחוון',
  'reader.role.spinbutton': 'כפתור ערך',
  'reader.role.image': 'תמונה',
  'reader.role.list': 'רשימה עם {count} פריטים',
  'reader.role.listOne': 'רשימה עם פריט אחד',
  'reader.role.listEnd': 'סוף הרשימה',
  'reader.role.table': 'טבלה עם {rows} שורות ו-{columns} עמודות',
  'reader.role.tableEnd': 'סוף הטבלה',
  'reader.role.header': 'כותרת עמודה',
  'reader.role.dialog': 'תיבת דו-שיח',
  'reader.role.figure': 'איור',
  'reader.role.separator': 'מפריד',
  'reader.role.tab': 'לשונית',
  'reader.role.menuitem': 'פריט תפריט',
  'reader.role.option': 'אפשרות',
  'reader.role.progressbar': 'מד התקדמות',
  'reader.role.video': 'וידאו',
  'reader.role.audio': 'אודיו',
  'reader.role.frame': 'מסגרת',
  'reader.landmark.navigation': 'ציון דרך ניווט',
  'reader.landmark.main': 'ציון דרך ראשי',
  'reader.landmark.banner': 'ציון דרך כותרת עליונה',
  'reader.landmark.contentinfo': 'ציון דרך פרטי תוכן',
  'reader.landmark.complementary': 'ציון דרך משלים',
  'reader.landmark.search': 'ציון דרך חיפוש',
  'reader.landmark.form': 'ציון דרך טופס',
  'reader.landmark.region': 'ציון דרך אזור',
  'reader.state.checked': 'מסומן',
  'reader.state.unchecked': 'לא מסומן',
  'reader.state.mixed': 'מסומן חלקית',
  'reader.state.pressed': 'לחוץ',
  'reader.state.notPressed': 'לא לחוץ',
  'reader.state.expanded': 'מורחב',
  'reader.state.collapsed': 'מכווץ',
  'reader.state.disabled': 'לא זמין',
  'reader.state.required': 'חובה',
  'reader.state.invalid': 'ערך לא תקין',
  'reader.state.readonly': 'לקריאה בלבד',
  'reader.state.selected': 'נבחר',
  'reader.state.current': 'נוכחי',
  'reader.state.on': 'דולק',
  'reader.state.off': 'כבוי',
  'reader.rule.reader-image-name': 'תמונה בלי טקסט חלופי',
  'reader.rule.reader-link-name': 'קישור בלי שם',
  'reader.rule.reader-button-name': 'כפתור בלי שם',
  'reader.rule.reader-field-name': 'שדה טופס בלי תווית',
  'reader.rule.reader-heading-empty': 'כותרת בלי טקסט',
  'reader.rule.reader-heading-order': 'כותרת שמדלגת על רמה',
  'reader.rule.reader-no-landmarks': 'אין ציוני דרך בעמוד הזה',
  'panel.show': 'הצגה בעמוד',
  'panel.showMissing': 'אָנְסִי כבר לא מוצא את זה בעמוד.',

  'exp.keyboard.what':
    'אָנְסִי לוקח את העכבר, מצייר טבעת בולטת על מה שבפוקוס וממספר כל עצירה, כך שתשתמשו בעמוד כמו מי שלא יכול להחזיק עכבר. הוא גם מציין איפה Tab נתקע, איפה הפוקוס לא נראה, ומה אפשר להגיע אליו רק בלחיצה.',
  'exp.keyboard.look':
    'משהו שאפשר ללחוץ עליו אבל אי אפשר להגיע אליו עם Tab.\nפוקוס שנעלם: לוחצים Tab ולא יודעים איפה אתם.\nמקום ש־Tab לא יוצא ממנו.\nסדר שקופץ בעמוד במקום לעקוב אחריו.',
  'exp.keyboard.fidelity':
    'מקלדת אמיתית בלי עכבר. הטבעת והמספרים הם של אָנְסִי; אותו אדם רואה רק את סגנון הפוקוס של האתר עצמו, שעלול להיות חיוור או חסר.',
  'exp.keyboard.mouseOff': 'לקחת גם את העכבר',
  'exp.keyboard.hint':
    'לוחצים לתוך האתר, או משתמשים ב״קפיצה לתוך האתר״, ואז זזים עם Tab, Shift+Tab, Enter ורווח.',
  'exp.keyboard.stops': '{count} עצירות פוקוס עד עכשיו',
  'exp.keyboard.noStops': 'עוד אין עצירות. עוברים באתר עם Tab והמסלול מופיע.',
  'exp.keyboard.traps': 'Tab נתקע כאן',
  'exp.keyboard.invisible': 'הפוקוס לא נראה כאן',
  'exp.keyboard.unreachable': 'אפשר ללחוץ, אבל המקלדת לא מגיעה',
  'exp.keyboard.clear': 'ניקוי המסלול',

  'exp.scan.what':
    'אָנְסִי מריץ את axe-core, הבודק שמאחורי Lighthouse ורוב כלי הנגישות, על העמוד כמו שהוא עכשיו, ומסביר כל תוצאה במילים פשוטות. בדיקות אוטומטיות תופסות בערך שליש מהמחסומים; שאר החוויות הן בשביל השאר.',
  'exp.scan.look':
    'קודם קריטי וחמור: אלה עוצרים מישהו לגמרי.\nאותו כלל על הרבה אלמנטים הוא בדרך כלל תיקון אחד בתבנית.\n״דורש מבט״ זה המקום שרק אדם יכול להכריע בו.',
  'exp.scan.fidelity':
    'הכללים של axe-core עצמו, בלי שינוי. מה שהוא מסמן אמיתי; מה שהוא מפספס עדיין צריך אתכם.',
  'exp.scan.run': 'סריקת העמוד',
  'exp.scan.again': 'סריקה מחדש',
  'exp.scan.scanning': 'סורק…',
  'exp.scan.failed': 'הסריקה לא הצליחה לרוץ בעמוד הזה. טענו אותו מחדש ונסו שוב.',
  'exp.scan.summary': '{issues} בעיות ב־{elements} אלמנטים',
  'exp.scan.clean':
    'הבדיקה האוטומטית לא מצאה כלום. זה לא הופך את העמוד לנגיש: בערך שני שלישים מהמחסומים דורשים אדם. נסו את החוויות האחרות.',
  'exp.scan.passed': '{count} בדיקות עברו',
  'exp.scan.incomplete': 'דורש מבט',
  'exp.scan.incompleteIntro': 'axe לא הצליח להכריע בעצמו. הסתכלו על כל אחד מהם.',
  'exp.scan.elements': '{count} אלמנטים',
  'exp.scan.element': 'אלמנט אחד',
  'exp.scan.wcag': 'WCAG {sc} (רמה {level})',
  'exp.scan.wcagNoLevel': 'WCAG {sc}',
  'exp.scan.bestPractice': 'מומלץ, לא כלל של WCAG',
  'exp.scan.more': 'עוד על הכלל הזה',
  'exp.scan.impact.critical': 'קריטי',
  'exp.scan.impact.serious': 'חמור',
  'exp.scan.impact.moderate': 'בינוני',
  'exp.scan.impact.minor': 'קל',

  'panel.region': 'חוויות, משימות וממצאים',
  'tabs.experiences': 'חוויות',
  'tabs.tasks': 'משימות',
  'tabs.findings': 'ממצאים',

  'tasks.title': 'משימות מודרכות',
  'tasks.intro':
    'שלושה דברים שכל מבקר מנסה לעשות. בוחרים משימה, עוברים על השלבים שלה עם חוויה פעילה, ושומרים את מה שמפריע בדרך.',
  'tasks.goal': 'המטרה',
  'tasks.steps': 'השלבים',
  'tasks.try': 'לנסות עם',
  'tasks.start': 'להתחיל את המשימה',
  'tasks.current': 'המשימה הנוכחית',
  'tasks.finish': 'לסיים את המשימה',
  'tasks.status.started': 'המשימה התחילה: {name}',
  'tasks.status.finished': 'המשימה הסתיימה',
  'tasks.turnOn': 'הפעלה של {name}',

  'task.contact': 'למצוא את פרטי הקשר',
  'task.contact.goal': 'למצוא מספר טלפון, כתובת אימייל או טופס יצירת קשר, ולהגיע אליהם.',
  'task.contact.steps':
    'מתחילים מדף הבית.\nמחפשים ״צור קשר״ בתפריט, בכותרת העמוד או בתחתית שלו.\nמגיעים לפרטים, ופותחים את הטופס אם יש אחד.',
  'task.form': 'למלא טופס',
  'task.form.goal': 'להשלים טופס באתר, מהשדה הראשון ועד האישור.',
  'task.form.steps':
    'פותחים טופס: יצירת קשר, ניוזלטר, הזמנה או הרשמה.\nממלאים כל שדה, כולל רשימות נפתחות ותיבות סימון.\nשולחים, ומוודאים שאפשר להבין שזה עבד, או מה השתבש.',
  'task.purchase': 'להשלים רכישה או הזמנה',
  'task.purchase.goal': 'לבחור מוצר או מועד, ולהגיע רחוק ככל שהאתר מאפשר.',
  'task.purchase.steps':
    'בוחרים מוצר, שירות או תאריך.\nמשנים בחירה: צבע, מידה, כמות או שעה.\nעוברים את העגלה או את שלבי ההזמנה, עד התשלום.',

  'findings.title': 'ממצאים',
  'findings.intro': 'מה ששמרתם בזמן השימוש באתר. מייצאים את זה כדוח למי שבונה את האתר.',
  'findings.empty':
    'עוד לא נשמר כלום. כשחוויה פעילה, לוחצים ״שמירה כממצא״ על מה שאָנְסִי שם לב אליו, או ״רישום ממצא״ על מה שפגשתם בעצמכם.',
  'findings.site': 'אתר',
  'findings.count': '{count} ממצאים',
  'findings.one': 'ממצא אחד',
  'findings.noteNew': 'רישום ממצא',
  'findings.save': 'שמירה כממצא',
  'findings.exportPdf': 'ייצוא ל־PDF…',
  'findings.saveText': 'שמירה כטקסט…',
  'findings.copy': 'העתקה כטקסט',
  'findings.copied': 'הועתק. אפשר להדביק באימייל או בכרטיס משימה.',
  'findings.saved': 'נשמר ב־{path}',
  'findings.exportFailed': 'לא הצלחנו להכין את הדוח. נסו שוב.',
  'findings.slikkLink': 'לסיים דוחות בקישור ״בקשו מ־Slikk.Dev לתקן את זה״',
  'findings.page': 'עמוד',
  'findings.when': 'מתי',
  'findings.experience': 'חוויה',
  'findings.task': 'משימה',
  'findings.noTask': 'בלי משימה',
  'findings.noExperience': 'בלי חוויה פעילה',
  'findings.note': 'ההערה שלכם',
  'findings.saw': 'מה אָנְסִי ראה',
  'findings.element': 'אלמנט',
  'findings.severity': 'חומרה',
  'findings.severity.owner': 'דווח על ידי בעל האתר',
  'findings.screenshot': 'צילום מסך',
  'findings.screenshotAlt': 'צילום מסך של {title}, עם האלמנט מוקף',
  'findings.screenshotShow': 'הצגת צילום המסך',
  'findings.retest': 'בדיקה חוזרת',
  'findings.retesting': 'פותח את העמוד ובודק…',
  'findings.retest.fixed': 'תוקן',
  'findings.retest.failing': 'עדיין שם',
  'findings.retest.unknown': 'אָנְסִי לא הצליח להכריע',
  'findings.retest.ask': 'אָנְסִי פתח את העמוד מחדש עם החוויה פעילה. הסתכלו, ואז אמרו:',
  'findings.retest.at': 'נבדק {date}: {outcome}',
  'findings.retest.busy': 'בדיקה אחרת עדיין רצה.',
  'findings.delete': 'מחיקה',
  'findings.deleteSure': 'למחוק לצמיתות',
  'findings.keep': 'להשאיר',
  'findings.status.deleted': 'הממצא נמחק',
  'findings.status.saved': 'הממצא נשמר',

  'capture.title': 'שמירת ממצא',
  'capture.saw': 'מה אָנְסִי ראה',
  'capture.page': 'עמוד',
  'capture.note': 'ההערה שלכם',
  'capture.noteHint': 'מה ניסיתם, מה קרה, ומה ציפיתם שיקרה במקום.',
  'capture.needNote': 'קודם כתבו מה שמתם לב אליו.',
  'capture.task': 'משימה',
  'capture.experience': 'חוויה',
  'capture.none': 'ללא',
  'capture.screenshot': 'לשמור את צילום המסך',
  'capture.screenshotAlt': 'העמוד כפי שהוא נראה עכשיו',
  'capture.noScreenshot': 'אָנְסִי לא הצליח לצלם את העמוד.',
  'capture.save': 'שמירת הממצא',
  'capture.cancel': 'ביטול',
  'capture.saved': 'נשמר. הממצא מחכה בלשונית הממצאים.',
  'capture.failed': 'לא הצלחנו לשמור את הממצא.',

  'report.title': 'ממצאי נגישות עבור {site}',
  'report.subtitle': 'הוכן עם אָנְסִי {version} בתאריך {date}',
  'report.what': 'מה זה',
  'report.whatBody':
    'בעל האתר השתמש בו כמו שמשתמשים בו אנשים עם מוגבלות, בעזרת אָנְסִי, כלי בדיקה חינמי, ושמר את מה שהפריע בדרך. כל ממצא מציין את העמוד, את האלמנט, וכשיש כזה, את קריטריון ההצלחה של WCAG שהוא מפר. כל אחד מהם מצביע על שינוי בקוד של האתר עצמו.',
  'report.severityIntro':
    'קריטי וחמור עוצרים מישהו לגמרי. בינוני וקל מקשים יותר מהנדרש. ״דווח על ידי בעל האתר״ הוא משהו שבעל האתר פגש בזמן השימוש; אָנְסִי לא מדד אותו.',
  'report.finding': 'ממצא {n} מתוך {total}',
  'report.closing': 'איך שולחים את זה למפתח',
  'report.closingBody':
    'מעבירים את הדוח למי שבונה או מתחזק את האתר. מבקשים לתקן כל ממצא בקוד של האתר עצמו, מהחמור ביותר, ולהחזיר לבדיקה נוספת: אָנְסִי יכול לפתוח כל עמוד מחדש. תוסף נגישות או סקריפט שמבטיח לתקן את הנגישות לא יעשה את זה; התיקונים שייכים לאתר.',
  'report.slikk': 'בקשו מ־Slikk.Dev לתקן את זה',
  'report.slikkBody': 'Slikk.Dev, הסטודיו שבנה את אָנְסִי, מתקן אתרים כמו זה.',
  'report.madeWith': 'הוכן עם אָנְסִי, חינמי ובקוד פתוח',

  // הכללים של אָנְסִי עצמו למה שעוזר המקלדת מוצא, באותו קול כמו הסריקה.
  'rule.keyboard-trap':
    'ברגע ש־Tab מגיע לכאן, הוא לא יכול לצאת. מי שבלי עכבר נתקע באלמנט הזה, והדרך היחידה החוצה היא לסגור את הדף. אפשרו ל־Tab ול־Escape להמשיך הלאה.',
  'rule.focus-visible':
    'כשהאלמנט הזה בפוקוס של המקלדת, שום דבר לא מראה את זה. מי שמתקדם עם Tab לא יודע איפה הוא נמצא. תנו לו סגנון פוקוס גלוי, או השאירו את זה של הדפדפן.',
  'rule.keyboard-unreachable':
    'זה מגיב ללחיצה, אבל Tab אף פעם לא מגיע לכאן. מי שבלי עכבר לא יכול להשתמש בזה בכלל. הפכו את זה לכפתור או לקישור אמיתי, או תנו tabindex=0 ומטפל מקלדת.',
  'rule.reader-image-name':
    'לקורא המסך אין מה להגיד על התמונה הזאת: הוא מכריז ״תמונה״ וממשיך. נותנים לה טקסט חלופי (alt) שאומר מה רואים בה, או alt="" אם היא רק קישוט.',
  'rule.reader-link-name':
    'הקישור הזה מוכרז כ״קישור״ ותו לא, ומשתמש קורא מסך לא יכול לדעת לאן הוא מוביל. נותנים לו טקסט, או aria-label, שאומר לאן הולכים.',
  'rule.reader-button-name':
    'הכפתור הזה מוכרז כ״כפתור״ ותו לא. מי שלא רואה את האייקון לא יודע מה הוא עושה. נותנים לו שם: טקסט גלוי, או aria-label.',
  'rule.reader-field-name':
    'השדה הזה מוכרז כ״עריכה״ בלי תווית, ומשתמש קורא מסך לא יודע מה להקליד בו. נותנים לו אלמנט label, או aria-label.',
  'rule.reader-heading-empty':
    'כותרת ריקה מוכרזת כ״כותרת רמה״ ואחריה כלום, והיא שוברת את המתווה שמשתמש קורא מסך קופץ דרכו. שמים בה טקסט או מורידים אותה.',
  'rule.reader-heading-order':
    'רמות הכותרות הן המתווה של העמוד: רמה 3 מיד אחרי רמה 1 נשמעת כמו פרק בלי סעיף. שומרים על סדר הרמות, ומעצבים אותן איך שרוצים.',
  'rule.reader-no-landmarks':
    'ציוני דרך (ראשי, ניווט, כותרת עליונה, פרטי תוכן) נותנים למשתמש קורא מסך לקפוץ ישר לחלק שהוא רוצה. בעמוד הזה אין אף אחד, ולכן קוראים מההתחלה בכל פעם. משתמשים באלמנטים main, nav, header ו-footer.',

  // כללי הסריקה במילים של אָנְסִי: את מי זה עוצר, ומה עושים. המפתחות הם מזהי הכללים של axe-core.
  'rule.color-contrast':
    'הטקסט קרוב מדי בצבע לרקע שלו. אנשים עם ראייה חלשה או עיוורון צבעים, וכל מי שעומד בשמש, מאבדים אותו. כוונו ל־4.5:1, או ל־3:1 לטקסט גדול.',
  'rule.image-alt':
    'לתמונה הזאת אין טקסט חלופי. קורא מסך אומר ״תמונה״ או מקריא את שם הקובץ. תארו מה התמונה מראה, או סמנו אותה כקישוט עם alt ריק.',
  'rule.input-image-alt':
    'לתמונה שמשמשת ככפתור אין שם. מי שמשתמש בקורא מסך לא יודע מה הלחיצה עושה. תנו לה alt שאומר את הפעולה.',
  'rule.role-img-alt': 'לאלמנט שמסומן כתמונה אין שם. הוסיפו aria-label שאומר מה הוא מראה.',
  'rule.svg-img-alt': 'ל־SVG שמסומן כתמונה אין שם. הוסיפו title או aria-label שאומר מה הוא מראה.',
  'rule.object-alt': 'לאובייקט מוטמע אין טקסט חלופי. הכניסו בתוכו טקסט שאומר מה הוא.',
  'rule.label':
    'לשדה הטופס הזה אין תווית. קורא מסך לא יכול להגיד מה מקלידים כאן. הוסיפו תווית גלויה, מחוברת עם for ו־id.',
  'rule.select-name': 'לרשימה הנפתחת הזאת אין שם. הוסיפו תווית שאומרת מה בוחרים.',
  'rule.label-title-only':
    'השדה הזה נקרא רק בעזרת tooltip. הוסיפו תווית גלויה: tooltip לא מופיע במסכי מגע, וקוראי מסך לעתים קרובות מדלגים עליו.',
  'rule.form-field-multiple-labels':
    'לשדה הזה יש יותר מתווית אחת. קוראי מסך עלולים להקריא רק אחת מהן. השאירו תווית אחת.',
  'rule.autocomplete-valid':
    'ערך ה־autocomplete כאן אינו ערך שדפדפנים מכירים, ולכן הם לא יכולים למלא את השדה. השתמשו בערך תקני, כמו email או given-name.',
  'rule.link-name':
    'לקישור הזה אין טקסט. קורא מסך אומר ״קישור״ ולא יותר. הוסיפו טקסט, או aria-label, שאומר לאן הוא מוביל.',
  'rule.button-name':
    'לכפתור הזה אין טקסט. קורא מסך אומר ״כפתור״ ולא יותר. הוסיפו טקסט, או aria-label, שאומר מה הוא עושה.',
  'rule.link-in-text-block':
    'הקישור הזה נבדל מהטקסט שסביבו בצבע בלבד. מי שלא רואה את הצבע הזה לא מוצא את הקישור. הוסיפו קו תחתון, או סימן אחר.',
  'rule.html-has-lang':
    'העמוד לא אומר באיזו שפה הוא כתוב. קוראי מסך מקריאים אותו אז בקול הלא נכון. הוסיפו lang לאלמנט html.',
  'rule.html-lang-valid':
    'קוד השפה של העמוד אינו תקין, ולכן קוראי מסך מתעלמים ממנו. השתמשו בקוד כמו he או en.',
  'rule.document-title':
    'לעמוד אין כותרת. זה הדבר הראשון שקורא מסך אומר, וזה מה שלשונית הדפדפן מציגה. הוסיפו title.',
  'rule.heading-order':
    'רמת כותרת דולגה. מי שמנווט עם קורא מסך לפי כותרות מאבד את המבנה. עברו רמה אחת בכל פעם.',
  'rule.empty-heading':
    'לכותרת הזאת אין טקסט. מי שקופץ אליה עם קורא מסך לא שומע כלום. הכניסו בה טקסט, או הסירו אותה.',
  'rule.page-has-heading-one':
    'לעמוד אין כותרת ראשית (h1). מי שמשתמש בקורא מסך נעזר בה כדי למצוא איפה העמוד מתחיל. הוסיפו אחת.',
  'rule.region':
    'חלק מהתוכן נמצא מחוץ לכל אזור (header, nav, main, footer). מי שקופץ עם קורא מסך בין אזורים מפספס אותו. הכניסו אותו לתוך אחד.',
  'rule.landmark-one-main':
    'לעמוד אין אזור main, או שיש לו יותר מאחד. מי שמשתמש בקורא מסך קופץ ל־main כדי לדלג על המסגרת. שיהיה בדיוק אחד.',
  'rule.bypass':
    'אין דרך לדלג על החלק העליון שחוזר בכל עמוד. מי שמשתמש במקלדת חייב לעבור עם Tab על כולו בכל עמוד. הוסיפו קישור דילוג או אזורים.',
  'rule.list':
    'הרשימה הזאת מכילה דברים שאינם פריטי רשימה. קוראי מסך מדווחים אז על אורך שגוי. השאירו רק li בתוך ul או ol.',
  'rule.listitem':
    'פריט הרשימה הזה נמצא מחוץ לרשימה. קוראי מסך לא יכריזו עליו כחלק ממנה. עטפו אותו ב־ul או ב־ol.',
  'rule.frame-title':
    'למסגרת הזאת אין כותרת. מי שמשתמש בקורא מסך לא יודע מה יש בה. הוסיפו מאפיין title.',
  'rule.meta-viewport':
    'העמוד חוסם הגדלה. אנשים עם ראייה חלשה לא יכולים להגדיל אותו. הסירו user-scalable=no ו־maximum-scale.',
  'rule.tabindex':
    'tabindex גדול מ־0 כופה סדר מעבר משלו. מי שמשתמש במקלדת קופץ אז בעמוד בלי לצפות לזה. השתמשו ב־0 או ב־1- ותנו לסדר העמוד להחליט.',
  'rule.target-size':
    'הפקד הזה קטן מכדי לפגוע בו. אנשים עם רעד, או עם אגודלים גדולים, מפספסים אותו. הגדילו אותו ל־24 על 24 פיקסלים לפחות, או תנו לו מרווח.',
  'rule.scrollable-region-focusable':
    'אי אפשר להגיע לאזור הגלילה הזה עם המקלדת, ולכן מי שמשתמש במקלדת לא יכול לגלול אותו. תנו לו tabindex=0.',
  'rule.nested-interactive':
    'פקד נמצא בתוך פקד אחר, כמו כפתור בתוך קישור. קוראי מסך ומקלדות לא מסתדרים עם שניהם. השאירו אחד.',
  'rule.aria-hidden-focus':
    'משהו שמוסתר מקוראי מסך עדיין יכול לקבל פוקוס. מי שמשתמש במקלדת נוחת על דבר שלא מוכרז. הוציאו אותו גם מסדר המעבר.',
  'rule.aria-required-attr':
    'לתפקיד ה־ARIA כאן חסר מאפיין שהוא זקוק לו, ולכן קוראי מסך לא יכולים לדווח על המצב שלו. הוסיפו את המאפיין הנדרש.',
  'rule.aria-valid-attr-value':
    'למאפיין ARIA יש ערך שהוא לא מאפשר. קוראי מסך מתעלמים ממנו. השתמשו באחד מהערכים המותרים.',
  'rule.aria-roles':
    'התפקיד הזה אינו תפקיד ARIA אמיתי. קוראי מסך מתעלמים ממנו. השתמשו בתפקיד תקין, או בלי תפקיד.',
  'rule.aria-allowed-attr':
    'מאפיין ה־ARIA הזה לא מותר בתפקיד הזה. קוראי מסך מתעלמים ממנו. הסירו אותו, או שנו את התפקיד.',
  'rule.duplicate-id-aria':
    'שני אלמנטים חולקים id ש־ARIA מצביע עליו. קוראי מסך הולכים אחרי הלא נכון. דאגו שכל id יהיה ייחודי.',
  'rule.video-caption':
    'לסרטון הזה אין כתוביות. צופים חירשים וכבדי שמיעה מאבדים את מה שנאמר. הוסיפו רצועת כתוביות.',
  'rule.image-redundant-alt':
    'ה־alt של התמונה חוזר על הטקסט שלידה, ולכן קוראי מסך אומרים אותו פעמיים. השתמשו כאן ב־alt ריק.',
  'rule.th-has-data-cells':
    'לכותרת טבלה אין תאים שהיא מכתירה. קוראי מסך לא יכולים להתאים בין הכותרת לנתונים. תקנו את מבנה הטבלה.',
  'rule.skip-link':
    'קישור הדילוג מצביע על משהו שלא קיים. לחיצה עליו לא עושה כלום. הפנו אותו לתוכן הראשי.',
}
