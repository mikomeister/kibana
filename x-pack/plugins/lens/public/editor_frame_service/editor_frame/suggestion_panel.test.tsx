/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { mountWithIntl as mount } from '@kbn/test/jest';
import { Visualization } from '../../types';
import {
  createMockVisualization,
  createMockDatasource,
  createExpressionRendererMock,
  DatasourceMock,
  createMockFramePublicAPI,
} from '../mocks';
import { act } from 'react-dom/test-utils';
import { ReactExpressionRendererType } from '../../../../../../src/plugins/expressions/public';
import { esFilters, IFieldType, IIndexPattern } from '../../../../../../src/plugins/data/public';
import { SuggestionPanel, SuggestionPanelProps } from './suggestion_panel';
import { getSuggestions, Suggestion } from './suggestion_helpers';
import { EuiIcon, EuiPanel, EuiToolTip } from '@elastic/eui';
import { dataPluginMock } from '../../../../../../src/plugins/data/public/mocks';
import { LensIconChartDatatable } from '../../assets/chart_datatable';

jest.mock('./suggestion_helpers');

const getSuggestionsMock = getSuggestions as jest.Mock;

describe('suggestion_panel', () => {
  let mockVisualization: Visualization;
  let mockDatasource: DatasourceMock;

  let expressionRendererMock: ReactExpressionRendererType;
  let dispatchMock: jest.Mock;

  const suggestion1State = { suggestion1: true };
  const suggestion2State = { suggestion2: true };

  let defaultProps: SuggestionPanelProps;

  beforeEach(() => {
    mockVisualization = createMockVisualization();
    mockDatasource = createMockDatasource('a');
    expressionRendererMock = createExpressionRendererMock();
    dispatchMock = jest.fn();

    getSuggestionsMock.mockReturnValue([
      {
        datasourceState: {},
        previewIcon: 'empty',
        score: 0.5,
        visualizationState: suggestion1State,
        visualizationId: 'vis',
        title: 'Suggestion1',
        keptLayerIds: ['a'],
      },
      {
        datasourceState: {},
        previewIcon: 'empty',
        score: 0.5,
        visualizationState: suggestion2State,
        visualizationId: 'vis',
        title: 'Suggestion2',
        keptLayerIds: ['a'],
      },
    ] as Suggestion[]);

    defaultProps = {
      activeDatasourceId: 'mock',
      datasourceMap: {
        mock: mockDatasource,
      },
      datasourceStates: {
        mock: {
          isLoading: false,
          state: {},
        },
      },
      activeVisualizationId: 'vis',
      visualizationMap: {
        vis: mockVisualization,
        vis2: createMockVisualization(),
      },
      visualizationState: {},
      dispatch: dispatchMock,
      ExpressionRenderer: expressionRendererMock,
      frame: createMockFramePublicAPI(),
      plugins: { data: dataPluginMock.createStartContract() },
    };
  });

  it('should list passed in suggestions', () => {
    const wrapper = mount(<SuggestionPanel {...defaultProps} />);

    expect(
      wrapper
        .find('[data-test-subj="lnsSuggestion"]')
        .find(EuiPanel)
        .map((el) => el.parents(EuiToolTip).prop('content'))
    ).toEqual(['Current', 'Suggestion1', 'Suggestion2']);
  });

  describe('uncommitted suggestions', () => {
    let suggestionState: Pick<
      SuggestionPanelProps,
      'datasourceStates' | 'activeVisualizationId' | 'visualizationState'
    >;
    let stagedPreview: SuggestionPanelProps['stagedPreview'];
    beforeEach(() => {
      suggestionState = {
        datasourceStates: {
          mock: {
            isLoading: false,
            state: {},
          },
        },
        activeVisualizationId: 'vis2',
        visualizationState: {},
      };

      stagedPreview = {
        datasourceStates: defaultProps.datasourceStates,
        visualization: {
          state: defaultProps.visualizationState,
          activeId: defaultProps.activeVisualizationId,
        },
      };
    });

    it('should not update suggestions if current state is moved to staged preview', () => {
      const wrapper = mount(<SuggestionPanel {...defaultProps} />);
      getSuggestionsMock.mockClear();
      wrapper.setProps({
        stagedPreview,
        ...suggestionState,
      });
      wrapper.update();
      expect(getSuggestionsMock).not.toHaveBeenCalled();
    });

    it('should update suggestions if staged preview is removed', () => {
      const wrapper = mount(<SuggestionPanel {...defaultProps} />);
      getSuggestionsMock.mockClear();
      wrapper.setProps({
        stagedPreview,
        ...suggestionState,
      });
      wrapper.update();
      wrapper.setProps({
        stagedPreview: undefined,
        ...suggestionState,
      });
      wrapper.update();
      expect(getSuggestionsMock).toHaveBeenCalledTimes(1);
    });

    it('should highlight currently active suggestion', () => {
      const wrapper = mount(<SuggestionPanel {...defaultProps} />);

      act(() => {
        wrapper.find('[data-test-subj="lnsSuggestion"]').at(2).simulate('click');
      });

      wrapper.update();

      expect(wrapper.find('[data-test-subj="lnsSuggestion"]').at(2).prop('className')).toContain(
        'lnsSuggestionPanel__button-isSelected'
      );
    });

    it('should rollback suggestion if current panel is clicked', () => {
      const wrapper = mount(<SuggestionPanel {...defaultProps} />);

      act(() => {
        wrapper.find('[data-test-subj="lnsSuggestion"]').at(2).simulate('click');
      });

      wrapper.update();

      act(() => {
        wrapper.find('[data-test-subj="lnsSuggestion"]').at(0).simulate('click');
      });

      wrapper.update();

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'ROLLBACK_SUGGESTION',
      });
    });
  });

  it('should dispatch visualization switch action if suggestion is clicked', () => {
    const wrapper = mount(<SuggestionPanel {...defaultProps} />);

    act(() => {
      wrapper.find('button[data-test-subj="lnsSuggestion"]').at(1).simulate('click');
    });
    wrapper.update();

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SELECT_SUGGESTION',
        initialState: suggestion1State,
      })
    );
  });

  it('should render preview expression if there is one', () => {
    mockDatasource.getLayers.mockReturnValue(['first']);
    (getSuggestions as jest.Mock).mockReturnValue([
      {
        datasourceState: {},
        previewIcon: 'empty',
        score: 0.5,
        visualizationState: suggestion1State,
        visualizationId: 'vis',
        title: 'Suggestion1',
      },
      {
        datasourceState: {},
        previewIcon: 'empty',
        score: 0.5,
        visualizationState: suggestion2State,
        visualizationId: 'vis',
        title: 'Suggestion2',
      },
    ] as Suggestion[]);

    (mockVisualization.toPreviewExpression as jest.Mock).mockReturnValueOnce(undefined);
    (mockVisualization.toPreviewExpression as jest.Mock).mockReturnValueOnce('test | expression');
    mockDatasource.toExpression.mockReturnValue('datasource_expression');

    const indexPattern = ({ id: 'index1' } as unknown) as IIndexPattern;
    const field = ({ name: 'myfield' } as unknown) as IFieldType;

    mount(
      <SuggestionPanel
        {...defaultProps}
        frame={{
          ...createMockFramePublicAPI(),
          filters: [esFilters.buildExistsFilter(field, indexPattern)],
        }}
      />
    );

    expect(expressionRendererMock).toHaveBeenCalledTimes(1);
    const passedExpression = (expressionRendererMock as jest.Mock).mock.calls[0][0].expression;

    expect(passedExpression).toMatchInlineSnapshot(`
      "kibana
      | lens_merge_tables layerIds=\\"first\\" tables={datasource_expression}
      | test
      | expression"
    `);
  });

  it('should render render icon if there is no preview expression', () => {
    mockDatasource.getLayers.mockReturnValue(['first']);
    getSuggestionsMock.mockReturnValue([
      {
        datasourceState: {},
        previewIcon: LensIconChartDatatable,
        score: 0.5,
        visualizationState: suggestion1State,
        visualizationId: 'vis',
        title: 'Suggestion1',
      },
      {
        datasourceState: {},
        previewIcon: 'empty',
        score: 0.5,
        visualizationState: suggestion2State,
        visualizationId: 'vis',
        title: 'Suggestion2',
        previewExpression: 'test | expression',
      },
    ] as Suggestion[]);

    (mockVisualization.toPreviewExpression as jest.Mock).mockReturnValueOnce(undefined);
    (mockVisualization.toPreviewExpression as jest.Mock).mockReturnValueOnce('test | expression');

    // this call will go to the currently active visualization
    (mockVisualization.toPreviewExpression as jest.Mock).mockReturnValueOnce('current | preview');

    mockDatasource.toExpression.mockReturnValue('datasource_expression');

    const wrapper = mount(<SuggestionPanel {...defaultProps} />);

    expect(wrapper.find(EuiIcon)).toHaveLength(1);
    expect(wrapper.find(EuiIcon).prop('type')).toEqual(LensIconChartDatatable);
  });
});
