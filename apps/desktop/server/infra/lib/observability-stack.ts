import { Stack, StackProps, Stage, Tags } from 'aws-cdk-lib'
import { Alarm } from 'aws-cdk-lib/aws-cloudwatch'
import { Construct } from 'constructs'
import { AppStage } from '../bin/infra'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'

export interface ObservabilityStackProps extends StackProps {
  albFargate: ApplicationLoadBalancedFargateService
}

export class ObservabilityStack extends Stack {
  public readonly alertTopic: Topic

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props)

    const stage = Stage.of(this) as AppStage
    const stageName = stage.stageName

    const alertTopic = new Topic(this, 'OrbitAlarmTopic', {
      topicName: `${stageName}-orbit-alarms`,
      displayName: `Orbit service alarms for ${stageName}`,
    })
    this.alertTopic = alertTopic

    const snsAction = new SnsAction(alertTopic)

    new Alarm(this, `${stageName}-HighOrbitFargateCpu`, {
      metric: props.albFargate.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'Fargate CPU > 80% for 2 consecutive periods',
      actionsEnabled: true,
      alarmName: `${stageName}-orbit-cpu-high`,
    }).addAlarmAction(snsAction)

    new Alarm(this, `${stageName}-HighOrbitFargateMemory`, {
      metric: props.albFargate.service.metricMemoryUtilization(),
      threshold: 75,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'Fargate Memory > 75% for 2 consecutive periods',
      actionsEnabled: true,
      alarmName: `${stageName}-orbit-memory-high`,
    }).addAlarmAction(snsAction)

    new Alarm(this, `${stageName}-OrbitUnhealthyTasks`, {
      metric: props.albFargate.targetGroup.metrics.unhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'There is at least 1 unhealthy task in the service',
      actionsEnabled: true,
      alarmName: `${stageName}-orbit-unhealthy-tasks`,
    }).addAlarmAction(snsAction)

    Tags.of(this).add('Project', 'Orbit')
  }
}
