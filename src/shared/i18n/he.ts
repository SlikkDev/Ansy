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

  'error.title': 'אָנְסִי לא הצליח לפתוח את הדף הזה',
  'error.body': 'בדקו את הכתובת ואת החיבור לאינטרנט, ונסו שוב.',
  'error.retry': 'לנסות שוב',

  'panel.title': 'חוויות',
  'panel.intro':
    'כל חוויה משנה את האופן שבו האתר שלכם נראה, נשמע או מגיב, כדי שתפגשו את המחסום בעצמכם. הן מגיעות בשלבים הבאים של הבנייה:',
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
  'menu.github': 'אָנְסִי ב־GitHub',
  'menu.website': 'האתר של אָנְסִי',
}
