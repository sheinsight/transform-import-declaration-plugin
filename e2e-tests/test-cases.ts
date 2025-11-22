/**
 * 共享的 E2E 测试用例定义
 * 用于确保 Babel 和 SWC 插件行为一致
 */

export interface TestCase {
  name: string;
  description: string;
  input: string;
  config: any;
  expected: string;
}

/**
 * 所有测试用例
 */
export const testCases: TestCase[] = [
  // 基础转换测试
  {
    name: 'basic-transform',
    description: '基础命名导入转换为默认导入',
    input: `import { Button } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";`
  },

  // 多个导入
  {
    name: 'multiple-imports',
    description: '转换多个命名导入',
    input: `import { Button, DatePicker, Table } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
import DatePicker from "antd/es/date-picker.js";
import Table from "antd/es/table.js";`
  },

  // 带样式导入
  {
    name: 'with-style-import',
    description: '生成副作用导入（样式文件）',
    input: `import { Button } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: [
            'antd/es/{{ filename }}.js',
            'antd/es/{{ filename }}/style/css'
          ]
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
import "antd/es/button/style/css";`
  },

  // 排除特定组件
  {
    name: 'with-exclude',
    description: '排除特定组件不转换',
    input: `import { Button, DatePicker } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          exclude: ['Button']
        }
      ]
    },
    expected: `import { Button } from "antd";
import DatePicker from "antd/es/date-picker.js";`
  },

  // 包含特定组件
  {
    name: 'with-include',
    description: '仅处理指定的组件',
    input: `import { Button, DatePicker, Table } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          include: ['Button', 'DatePicker']
        }
      ]
    },
    expected: `import { Table } from "antd";
import Button from "antd/es/button.js";
import DatePicker from "antd/es/date-picker.js";`
  },

  // 多规则配置
  {
    name: 'multi-config',
    description: '多个配置规则组合使用',
    input: `import { Button, DatePicker } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: [
            'antd/es/{{ filename }}.js',
            'antd/css/{{ filename }}.css'
          ],
          exclude: ['Button']
        },
        {
          source: 'antd',
          filename: 'kebabCase',
          output: [
            'antd/es/{{ filename }}.js',
            'antd/css/{{ filename }}.png'
          ],
          include: ['Button']
        }
      ]
    },
    expected: `import DatePicker from "antd/es/date-picker.js";
import "antd/css/date-picker.css";
import Button from "antd/es/button.js";
import "antd/css/button.png";`
  },

  // Named 说明符
  {
    name: 'named-specifier',
    description: '使用 named 导入说明符',
    input: `import { debounce, throttle } from "lodash";`,
    config: {
      config: [
        {
          source: 'lodash',
          filename: 'kebabCase',
          output: ['lodash/{{ filename }}.js'],
          specifier: 'named'
        }
      ]
    },
    expected: `import { debounce } from "lodash/debounce.js";
import { throttle } from "lodash/throttle.js";`
  },

  // Namespace 说明符
  {
    name: 'namespace-specifier',
    description: '使用 namespace 导入说明符',
    input: `import { DateUtils, StringUtils } from "utils";`,
    config: {
      config: [
        {
          source: 'utils',
          filename: 'camelCase',
          output: ['utils/{{ filename }}.js'],
          specifier: 'namespace'
        }
      ]
    },
    expected: `import * as DateUtils from "utils/dateUtils.js";
import * as StringUtils from "utils/stringUtils.js";`
  },

  // snake_case 文件名
  {
    name: 'snake-case-filename',
    description: '使用 snake_case 文件名',
    input: `import { DatePicker } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'snakeCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import DatePicker from "antd/es/date_picker.js";`
  },

  // PascalCase 文件名
  {
    name: 'pascal-case-filename',
    description: '使用 PascalCase 文件名',
    input: `import { DatePicker } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'pascalCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import DatePicker from "antd/es/DatePicker.js";`
  },

  // camelCase 文件名
  {
    name: 'camel-case-filename',
    description: '使用 camelCase 文件名',
    input: `import { DatePicker } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'camelCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import DatePicker from "antd/es/datePicker.js";`
  },

  // 保留其他导入
  {
    name: 'preserve-other-imports',
    description: '保留非命名导入（默认导入等）',
    input: `import antd, { Button } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import antd from "antd";
import Button from "antd/es/button.js";`
  },

  // 不匹配的源不处理
  {
    name: 'non-matching-source',
    description: '不匹配的源模块保持不变',
    input: `import { Button } from "other-lib";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import { Button } from "other-lib";`
  },

  // 复杂场景：多个源
  {
    name: 'multiple-sources',
    description: '处理多个不同的源模块',
    input: `import { Button } from "antd";
import { debounce } from "lodash";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        },
        {
          source: 'lodash',
          filename: 'kebabCase',
          output: ['lodash/{{ filename }}.js'],
          specifier: 'named'
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
import { debounce } from "lodash/debounce.js";`
  },

  // 空导入（无命名导入）
  {
    name: 'no-named-imports',
    description: '只有默认导入或命名空间导入，没有命名导入',
    input: `import antd from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import antd from "antd";`
  },

  // 重复的组件名
  {
    name: 'duplicate-component-names',
    description: '导入同一个组件多次（使用别名）',
    input: `import { Button, Button as Btn } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
import Btn from "antd/es/button.js";`
  },

  // 使用别名的导入
  {
    name: 'import-with-alias',
    description: '命名导入使用别名',
    input: `import { Button as AntButton } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import AntButton from "antd/es/button.js";`
  },

  // 混合：别名 + 多个副作用导入
  {
    name: 'alias-with-multiple-side-effects',
    description: '别名导入 + 多个副作用导入',
    input: `import { DatePicker as MyDatePicker } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: [
            'antd/es/{{ filename }}.js',
            'antd/es/{{ filename }}/style/css',
            'antd/es/{{ filename }}/style/index.less'
          ]
        }
      ]
    },
    expected: `import MyDatePicker from "antd/es/date-picker.js";
import "antd/es/date-picker/style/css";
import "antd/es/date-picker/style/index.less";`
  },

  // 所有组件都被 exclude
  {
    name: 'all-excluded',
    description: '所有组件都在 exclude 列表中',
    input: `import { Button, Table } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          exclude: ['Button', 'Table']
        }
      ]
    },
    expected: `import { Button, Table } from "antd";`
  },

  // 所有组件都不在 include 列表
  {
    name: 'none-included',
    description: '所有组件都不在 include 列表中',
    input: `import { Button, Table } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          include: ['Form', 'Input']
        }
      ]
    },
    expected: `import { Button, Table } from "antd";`
  },

  // 部分匹配 include
  {
    name: 'partial-include-match',
    description: '部分组件在 include 列表中',
    input: `import { Button, Table, Form } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          include: ['Button', 'Form']
        }
      ]
    },
    expected: `import { Table } from "antd";
import Button from "antd/es/button.js";
import Form from "antd/es/form.js";`
  },

  // 复杂命名：连续大写字母
  {
    name: 'consecutive-capitals',
    description: '处理连续大写字母的组件名',
    input: `import { XMLHttpRequest, HTMLElement } from "utils";`,
    config: {
      config: [
        {
          source: 'utils',
          filename: 'kebabCase',
          output: ['utils/{{ filename }}.js']
        }
      ]
    },
    expected: `import XMLHttpRequest from "utils/xml-http-request.js";
import HTMLElement from "utils/html-element.js";`
  },

  // 单字母组件名
  {
    name: 'single-letter-component',
    description: '单字母组件名',
    input: `import { A, B, C } from "components";`,
    config: {
      config: [
        {
          source: 'components',
          filename: 'kebabCase',
          output: ['components/{{ filename }}.js']
        }
      ]
    },
    expected: `import A from "components/a.js";
import B from "components/b.js";
import C from "components/c.js";`
  },

  // 数字后缀的组件名
  {
    name: 'component-with-numbers',
    description: '包含数字的组件名',
    input: `import { Button2, Table3D } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button2 from "antd/es/button2.js";
import Table3D from "antd/es/table3-d.js";`
  },

  // 同一行多个不同源的导入
  {
    name: 'multiple-imports-same-line',
    description: '同一行有多个不同源的导入（虽然不常见）',
    input: `import { Button } from "antd"; import { debounce } from "lodash";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        },
        {
          source: 'lodash',
          filename: 'kebabCase',
          output: ['lodash/{{ filename }}.js'],
          specifier: 'named'
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
import { debounce } from "lodash/debounce.js";`
  },

  // 命名空间导入（不转换）
  {
    name: 'namespace-import-preserved',
    description: '命名空间导入不应该被转换',
    input: `import * as antd from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import * as antd from "antd";`
  },

  // 类型导入（TypeScript）
  {
    name: 'type-import',
    description: 'TypeScript 类型导入',
    input: `import type { ButtonProps } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import type { ButtonProps } from "antd";`
  },

  // 混合：值和类型导入
  {
    name: 'mixed-value-and-type-imports',
    description: '混合值导入和类型导入',
    input: `import { Button, type ButtonProps } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import { type ButtonProps } from "antd";
import Button from "antd/es/button.js";`
  },

  // ==========================================
  // SyntaxContext 保持测试（变量引用场景）
  // 这些测试确保转换后的变量名不会被 Hygiene 系统重命名
  // ==========================================

  // 单个变量引用
  {
    name: 'syntax-context-single-usage',
    description: '转换后变量引用应保持正确（单个变量）',
    input: `import { Button } from "antd";
console.log(Button);`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
console.log(Button);`
  },

  // 多个变量多次引用
  {
    name: 'syntax-context-multiple-usage',
    description: '转换后多个变量引用应保持正确',
    input: `import { Button, DatePicker } from "antd";
console.log(Button);
render(DatePicker);`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
import DatePicker from "antd/es/date-picker.js";
console.log(Button);
render(DatePicker);`
  },

  // 使用别名时的变量引用
  {
    name: 'syntax-context-with-alias',
    description: '使用别名时变量引用应保持正确',
    input: `import { Button as AntButton } from "antd";
console.log(AntButton);`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import AntButton from "antd/es/button.js";
console.log(AntButton);`
  },

  // named specifier 时的变量引用
  {
    name: 'syntax-context-named-specifier-usage',
    description: 'named specifier 转换后变量引用应保持正确',
    input: `import { debounce } from "lodash";
const fn = debounce(callback, 100);`,
    config: {
      config: [
        {
          source: 'lodash',
          filename: 'kebabCase',
          output: ['lodash/{{ filename }}.js'],
          specifier: 'named'
        }
      ]
    },
    expected: `import { debounce } from "lodash/debounce.js";
const fn = debounce(callback, 100);`
  },

  // namespace specifier 时的变量引用
  {
    name: 'syntax-context-namespace-specifier-usage',
    description: 'namespace specifier 转换后变量引用应保持正确',
    input: `import { DateUtils } from "utils";
const date = DateUtils.format(new Date());`,
    config: {
      config: [
        {
          source: 'utils',
          filename: 'camelCase',
          output: ['utils/{{ filename }}.js'],
          specifier: 'namespace'
        }
      ]
    },
    expected: `import * as DateUtils from "utils/dateUtils.js";
const date = DateUtils.format(new Date());`
  },

  // 复杂场景：多个引用 + 函数调用
  {
    name: 'syntax-context-complex-usage',
    description: '复杂场景下变量引用应保持正确',
    input: `import { Button, message } from "antd";
function App() {
  message.success("clicked");
  return Button;
}`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";
import message from "antd/es/message.js";
function App() {
  message.success("clicked");
  return Button;
}`
  }
];

/**
 * 配置验证测试用例
 */
export const validationTestCases = [
  {
    name: 'reject-both-include-and-exclude',
    description: '拒绝同时配置 include 和 exclude',
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          include: ['Button'],
          exclude: ['Table']
        }
      ]
    },
    shouldThrow: true,
    errorMessage: "'include' and 'exclude' cannot be used together"
  }
];
